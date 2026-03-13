package usecases

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	syncpkg "github.com/yourusername/gosmartmillscale/desktop-app/internal/sync"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	_ "modernc.org/sqlite"
)

type testMasterSyncClientFactory struct {
	client *syncpkg.GraphQLClient
	err    error
}

func (f *testMasterSyncClientFactory) GetActiveClient(ctx context.Context) (*syncpkg.GraphQLClient, error) {
	_ = ctx
	if f.err != nil {
		return nil, f.err
	}
	return f.client, nil
}

func TestMasterDataSyncUseCase_ServerPriorityMerge(t *testing.T) {
	t.Parallel()

	db := openMasterSyncTestDB(t, "server-priority")
	seedMasterSyncBaseline(t, db)

	server := newMasterSyncTestServer(t, masterSyncPayload())
	defer server.Close()

	client := syncpkg.NewGraphQLClient(server.URL, uuid.New(), "test-api-key")
	uc := NewMasterDataSyncUseCase(db, &testMasterSyncClientFactory{client: client})

	result, err := uc.TriggerMasterDataSync(context.Background(), &dto.MasterDataSyncRequest{
		TriggerSource: "manual",
		Scope:         []string{"estate", "afdeling", "blok"},
	})
	if err != nil {
		t.Fatalf("TriggerMasterDataSync returned error: %v", err)
	}
	if result == nil || !result.Success {
		t.Fatalf("expected successful sync result, got: %+v", result)
	}

	assertEstateMerged(t, db)
	assertAfdelingMerged(t, db)
	assertBlokMerged(t, db)

	counts := result.Counts
	if counts["estate"].Created != 1 || counts["estate"].Updated != 1 || counts["estate"].Deactivated != 1 {
		t.Fatalf("unexpected estate counters: %+v", counts["estate"])
	}
	if counts["afdeling"].Created != 1 || counts["afdeling"].Updated != 1 || counts["afdeling"].Deactivated != 1 {
		t.Fatalf("unexpected afdeling counters: %+v", counts["afdeling"])
	}
	if counts["blok"].Created != 1 || counts["blok"].Updated != 1 || counts["blok"].Deactivated != 1 {
		t.Fatalf("unexpected blok counters: %+v", counts["blok"])
	}

	status, err := uc.GetMasterDataSyncStatus(context.Background())
	if err != nil {
		t.Fatalf("GetMasterDataSyncStatus returned error: %v", err)
	}
	if status == nil || status.LastResult == nil || !status.LastResult.Success {
		t.Fatalf("expected successful last status, got: %+v", status)
	}
}

func TestMasterDataSyncUseCase_ParallelLock(t *testing.T) {
	t.Parallel()

	db := openMasterSyncTestDB(t, "parallel-lock")
	server := newDelayedMasterSyncServer(t, masterSyncPayload(), 250*time.Millisecond)
	defer server.Close()

	client := syncpkg.NewGraphQLClient(server.URL, uuid.New(), "test-api-key")
	uc := NewMasterDataSyncUseCase(db, &testMasterSyncClientFactory{client: client})

	var wg sync.WaitGroup
	wg.Add(1)

	go func() {
		defer wg.Done()
		_, _ = uc.TriggerMasterDataSync(context.Background(), &dto.MasterDataSyncRequest{TriggerSource: "auto"})
	}()

	time.Sleep(40 * time.Millisecond)

	_, err := uc.TriggerMasterDataSync(context.Background(), &dto.MasterDataSyncRequest{TriggerSource: "manual"})
	if !errors.Is(err, ErrMasterDataSyncInProgress) {
		t.Fatalf("expected ErrMasterDataSyncInProgress, got: %v", err)
	}

	wg.Wait()
}

func openMasterSyncTestDB(t *testing.T, suffix string) *gorm.DB {
	t.Helper()

	dsn := "file:master_sync_" + suffix + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Dialector{DriverName: "sqlite", DSN: dsn}, &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}

	if err := db.AutoMigrate(&database.MasterEstate{}, &database.MasterAfdeling{}, &database.MasterBlok{}); err != nil {
		t.Fatalf("failed to migrate master tables: %v", err)
	}

	return db
}

func seedMasterSyncBaseline(t *testing.T, db *gorm.DB) {
	t.Helper()

	now := time.Now().Add(-time.Hour)

	estateManual := database.MasterEstate{
		KodeEstate: "EST01",
		NamaEstate: "Estate Lokal Lama",
		Luas:       100,
		Lokasi:     "Lokal",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	estateManualUnique := database.MasterEstate{
		KodeEstate: "LOCAL_ONLY",
		NamaEstate: "Estate Manual Unik",
		Luas:       50,
		Lokasi:     "Manual",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	estateServerStale := database.MasterEstate{
		KodeEstate:      "EST_STALE",
		NamaEstate:      "Estate Server Lama",
		Luas:            75,
		Lokasi:          "Server",
		IsActive:        true,
		DataSource:      database.MasterDataSourceServer,
		LastSyncedAt:    &now,
		ServerUpdatedAt: &now,
	}

	if err := db.Create(&estateManual).Error; err != nil {
		t.Fatalf("failed to seed estateManual: %v", err)
	}
	if err := db.Create(&estateManualUnique).Error; err != nil {
		t.Fatalf("failed to seed estateManualUnique: %v", err)
	}
	if err := db.Create(&estateServerStale).Error; err != nil {
		t.Fatalf("failed to seed estateServerStale: %v", err)
	}

	afdelingManual := database.MasterAfdeling{
		IDEstate:     estateManual.ID,
		KodeAfdeling: "AFD01",
		NamaAfdeling: "Afdeling Lokal Lama",
		Luas:         10,
		IsActive:     true,
		DataSource:   database.MasterDataSourceManual,
	}
	afdelingManualUnique := database.MasterAfdeling{
		IDEstate:     estateManualUnique.ID,
		KodeAfdeling: "AFDLOCAL",
		NamaAfdeling: "Afdeling Manual Unik",
		Luas:         20,
		IsActive:     true,
		DataSource:   database.MasterDataSourceManual,
	}
	afdelingServerStale := database.MasterAfdeling{
		IDEstate:        estateServerStale.ID,
		KodeAfdeling:    "AFD_STALE",
		NamaAfdeling:    "Afdeling Server Lama",
		Luas:            15,
		IsActive:        true,
		DataSource:      database.MasterDataSourceServer,
		LastSyncedAt:    &now,
		ServerUpdatedAt: &now,
	}

	if err := db.Create(&afdelingManual).Error; err != nil {
		t.Fatalf("failed to seed afdelingManual: %v", err)
	}
	if err := db.Create(&afdelingManualUnique).Error; err != nil {
		t.Fatalf("failed to seed afdelingManualUnique: %v", err)
	}
	if err := db.Create(&afdelingServerStale).Error; err != nil {
		t.Fatalf("failed to seed afdelingServerStale: %v", err)
	}

	blokManual := database.MasterBlok{
		IDAfdeling: afdelingManual.ID,
		KodeBlok:   "BLK01",
		NamaBlok:   "Blok Lokal Lama",
		Luas:       5,
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	blokManualUnique := database.MasterBlok{
		IDAfdeling: afdelingManualUnique.ID,
		KodeBlok:   "BLKLOCAL",
		NamaBlok:   "Blok Manual Unik",
		Luas:       6,
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	blokServerStale := database.MasterBlok{
		IDAfdeling:      afdelingServerStale.ID,
		KodeBlok:        "BLK_STALE",
		NamaBlok:        "Blok Server Lama",
		Luas:            8,
		IsActive:        true,
		DataSource:      database.MasterDataSourceServer,
		LastSyncedAt:    &now,
		ServerUpdatedAt: &now,
	}

	if err := db.Create(&blokManual).Error; err != nil {
		t.Fatalf("failed to seed blokManual: %v", err)
	}
	if err := db.Create(&blokManualUnique).Error; err != nil {
		t.Fatalf("failed to seed blokManualUnique: %v", err)
	}
	if err := db.Create(&blokServerStale).Error; err != nil {
		t.Fatalf("failed to seed blokServerStale: %v", err)
	}
}

func masterSyncPayload() map[string]interface{} {
	updatedAt := time.Now().UTC().Format(time.RFC3339)

	return map[string]interface{}{
		"masterReferenceData": map[string]interface{}{
			"estates": []map[string]interface{}{
				{"kodeEstate": "EST01", "namaEstate": "Estate Server Baru", "luas": 111.1, "lokasi": "Server", "isActive": true, "updatedAt": updatedAt},
				{"kodeEstate": "EST02", "namaEstate": "Estate Server 2", "luas": 222.2, "lokasi": "Server 2", "isActive": true, "updatedAt": updatedAt},
			},
			"afdelings": []map[string]interface{}{
				{"kodeEstate": "EST01", "kodeAfdeling": "AFD01", "namaAfdeling": "Afdeling Server Baru", "luas": 11.1, "isActive": true, "updatedAt": updatedAt},
				{"kodeEstate": "EST02", "kodeAfdeling": "AFD09", "namaAfdeling": "Afdeling Server 9", "luas": 29.9, "isActive": true, "updatedAt": updatedAt},
			},
			"bloks": []map[string]interface{}{
				{"kodeEstate": "EST01", "kodeAfdeling": "AFD01", "kodeBlok": "BLK01", "namaBlok": "Blok Server Baru", "luas": 7.7, "isActive": true, "updatedAt": updatedAt},
				{"kodeEstate": "EST02", "kodeAfdeling": "AFD09", "kodeBlok": "BLK99", "namaBlok": "Blok Server 99", "luas": 9.9, "isActive": true, "updatedAt": updatedAt},
			},
		},
	}
}

func newMasterSyncTestServer(t *testing.T, data map[string]interface{}) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var reqBody struct {
			Query string `json:"query"`
		}
		_ = json.NewDecoder(r.Body).Decode(&reqBody)

		if strings.Contains(reqBody.Query, "health") {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"health": map[string]interface{}{"status": "OK"},
				},
			})
			return
		}

		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"data": data,
		})
	}))
}

func newDelayedMasterSyncServer(t *testing.T, data map[string]interface{}, delay time.Duration) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(delay)
		w.Header().Set("Content-Type", "application/json")

		var reqBody struct {
			Query string `json:"query"`
		}
		_ = json.NewDecoder(r.Body).Decode(&reqBody)

		if strings.Contains(reqBody.Query, "health") {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"health": map[string]interface{}{"status": "OK"},
				},
			})
			return
		}

		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"data": data,
		})
	}))
}

func assertEstateMerged(t *testing.T, db *gorm.DB) {
	t.Helper()

	var estate database.MasterEstate
	if err := db.Where("kode_estate = ?", "EST01").First(&estate).Error; err != nil {
		t.Fatalf("expected EST01 estate to exist: %v", err)
	}
	if estate.NamaEstate != "Estate Server Baru" || estate.DataSource != database.MasterDataSourceServer {
		t.Fatalf("expected EST01 overwritten by server, got: %+v", estate)
	}

	var estateManual database.MasterEstate
	if err := db.Where("kode_estate = ?", "LOCAL_ONLY").First(&estateManual).Error; err != nil {
		t.Fatalf("expected LOCAL_ONLY to remain: %v", err)
	}
	if estateManual.DataSource != database.MasterDataSourceManual || !estateManual.IsActive {
		t.Fatalf("expected LOCAL_ONLY manual active, got: %+v", estateManual)
	}

	var stale database.MasterEstate
	if err := db.Where("kode_estate = ?", "EST_STALE").First(&stale).Error; err != nil {
		t.Fatalf("expected EST_STALE to exist: %v", err)
	}
	if stale.IsActive {
		t.Fatalf("expected EST_STALE to be deactivated")
	}
}

func assertAfdelingMerged(t *testing.T, db *gorm.DB) {
	t.Helper()

	var afdeling database.MasterAfdeling
	err := db.Joins("JOIN master_estate ON master_estate.id = master_afdeling.id_estate").
		Where("master_estate.kode_estate = ? AND master_afdeling.kode_afdeling = ?", "EST01", "AFD01").
		First(&afdeling).Error
	if err != nil {
		t.Fatalf("expected EST01/AFD01 afdeling to exist: %v", err)
	}
	if afdeling.NamaAfdeling != "Afdeling Server Baru" || afdeling.DataSource != database.MasterDataSourceServer {
		t.Fatalf("expected EST01/AFD01 overwritten by server, got: %+v", afdeling)
	}

	var stale database.MasterAfdeling
	err = db.Joins("JOIN master_estate ON master_estate.id = master_afdeling.id_estate").
		Where("master_estate.kode_estate = ? AND master_afdeling.kode_afdeling = ?", "EST_STALE", "AFD_STALE").
		First(&stale).Error
	if err != nil {
		t.Fatalf("expected stale afdeling to exist: %v", err)
	}
	if stale.IsActive {
		t.Fatalf("expected stale afdeling to be deactivated")
	}
}

func assertBlokMerged(t *testing.T, db *gorm.DB) {
	t.Helper()

	var blok database.MasterBlok
	err := db.Joins("JOIN master_afdeling ON master_afdeling.id = master_blok.id_afdeling").
		Joins("JOIN master_estate ON master_estate.id = master_afdeling.id_estate").
		Where("master_estate.kode_estate = ? AND master_afdeling.kode_afdeling = ? AND master_blok.kode_blok = ?", "EST01", "AFD01", "BLK01").
		First(&blok).Error
	if err != nil {
		t.Fatalf("expected EST01/AFD01/BLK01 blok to exist: %v", err)
	}
	if blok.NamaBlok != "Blok Server Baru" || blok.DataSource != database.MasterDataSourceServer {
		t.Fatalf("expected EST01/AFD01/BLK01 overwritten by server, got: %+v", blok)
	}

	var stale database.MasterBlok
	err = db.Joins("JOIN master_afdeling ON master_afdeling.id = master_blok.id_afdeling").
		Joins("JOIN master_estate ON master_estate.id = master_afdeling.id_estate").
		Where("master_estate.kode_estate = ? AND master_afdeling.kode_afdeling = ? AND master_blok.kode_blok = ?", "EST_STALE", "AFD_STALE", "BLK_STALE").
		First(&stale).Error
	if err != nil {
		t.Fatalf("expected stale blok to exist: %v", err)
	}
	if stale.IsActive {
		t.Fatalf("expected stale blok to be deactivated")
	}
}
