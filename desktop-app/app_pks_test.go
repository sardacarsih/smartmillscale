package main

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/bootstrap"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/logger"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/presentation/controllers"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/wails"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
	_ "modernc.org/sqlite"
)

func TestCreateTimbang1_AppContract_WithTBSBlockDetailsJSON(t *testing.T) {
	db := openAppPKSContractTestDB(t)
	seed := seedAppPKSContractData(t, db)

	pksService := service.NewPKSService(db, "test-device")
	pksController := controllers.NewPKSController(pksService)

	application := &bootstrap.Application{
		Container: &bootstrap.Container{
			DB:            db,
			PKSController: pksController,
		},
	}

	app := &App{
		application: application,
		handler:     wails.NewWailsHandler(application, logger.NewNoOpLogger()),
	}

	requestJSON := fmt.Sprintf(`{
		"noTransaksi":"TRS-APP-CONTRACT-%d",
		"idProduk":%d,
		"idUnit":%d,
		"driverName":"Driver Kontrak",
		"sumberTbs":"Campuran Test",
		"grade":"A",
		"bruto":1300,
		"tara":250,
		"netto":1050,
		"tbsBlockDetails":[
			{"idBlok":%d,"janjang":12,"brondolanKg":4.5},
			{"idBlok":%d,"janjang":8,"brondolanKg":2.25}
		]
	}`, time.Now().UnixNano(), seed.ProductTBSID, seed.UnitID, seed.BlokAID, seed.BlokBID)

	responseJSON, err := app.CreateTimbang1(requestJSON, seed.OperatorID.String())
	if err != nil {
		t.Fatalf("CreateTimbang1 returned error: %v", err)
	}

	var response struct {
		NoTransaksi     string `json:"no_transaksi"`
		TBSBlockDetails []struct {
			IDBlok      uint    `json:"id_blok"`
			IDEstate    uint    `json:"id_estate"`
			IDAfdeling  uint    `json:"id_afdeling"`
			Janjang     int     `json:"janjang"`
			BrondolanKg float64 `json:"brondolan_kg"`
		} `json:"tbs_block_details"`
	}

	if err := json.Unmarshal([]byte(responseJSON), &response); err != nil {
		t.Fatalf("failed to unmarshal response JSON: %v", err)
	}

	if response.NoTransaksi == "" {
		t.Fatal("expected no_transaksi to be present in response")
	}
	if len(response.TBSBlockDetails) != 2 {
		t.Fatalf("expected 2 tbs_block_details, got %d", len(response.TBSBlockDetails))
	}

	byBlock := make(map[uint]struct {
		IDEstate    uint
		IDAfdeling  uint
		Janjang     int
		BrondolanKg float64
	}, 2)
	for _, item := range response.TBSBlockDetails {
		byBlock[item.IDBlok] = struct {
			IDEstate    uint
			IDAfdeling  uint
			Janjang     int
			BrondolanKg float64
		}{
			IDEstate:    item.IDEstate,
			IDAfdeling:  item.IDAfdeling,
			Janjang:     item.Janjang,
			BrondolanKg: item.BrondolanKg,
		}
	}

	rowA, ok := byBlock[seed.BlokAID]
	if !ok {
		t.Fatalf("expected block detail for blok A id=%d", seed.BlokAID)
	}
	if rowA.IDEstate != seed.EstateAID || rowA.IDAfdeling != seed.AfdelingAID {
		t.Fatalf("unexpected lineage for blok A: estate=%d afdeling=%d", rowA.IDEstate, rowA.IDAfdeling)
	}
	if rowA.Janjang != 12 || rowA.BrondolanKg != 4.5 {
		t.Fatalf("unexpected values for blok A: janjang=%d brondolan=%v", rowA.Janjang, rowA.BrondolanKg)
	}

	rowB, ok := byBlock[seed.BlokBID]
	if !ok {
		t.Fatalf("expected block detail for blok B id=%d", seed.BlokBID)
	}
	if rowB.IDEstate != seed.EstateBID || rowB.IDAfdeling != seed.AfdelingBID {
		t.Fatalf("unexpected lineage for blok B: estate=%d afdeling=%d", rowB.IDEstate, rowB.IDAfdeling)
	}
	if rowB.Janjang != 8 || rowB.BrondolanKg != 2.25 {
		t.Fatalf("unexpected values for blok B: janjang=%d brondolan=%v", rowB.Janjang, rowB.BrondolanKg)
	}
}

type appPKSContractSeed struct {
	OperatorID   uuid.UUID
	ProductTBSID uint
	UnitID       uint
	EstateAID    uint
	EstateBID    uint
	AfdelingAID  uint
	AfdelingBID  uint
	BlokAID      uint
	BlokBID      uint
}

func openAppPKSContractTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := fmt.Sprintf("file:app_pks_contract_%d?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := gorm.Open(sqlite.Dialector{DriverName: "sqlite", DSN: dsn}, &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}

	if err := db.AutoMigrate(
		&auth.User{},
		&database.MasterProduk{},
		&database.MasterUnit{},
		&database.MasterSupplier{},
		&database.MasterEstate{},
		&database.MasterAfdeling{},
		&database.MasterBlok{},
		&database.TimbanganPKS{},
		&database.TimbanganPKSTBSBlockDetail{},
	); err != nil {
		t.Fatalf("failed to migrate schema: %v", err)
	}

	return db
}

func seedAppPKSContractData(t *testing.T, db *gorm.DB) appPKSContractSeed {
	t.Helper()

	user := auth.User{
		ID:           uuid.New(),
		Username:     "operator-contract",
		PasswordHash: "hash",
		FullName:     "Operator Contract",
		Role:         auth.RoleTimbangan,
		IsActive:     true,
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	product := database.MasterProduk{
		KodeProduk: "TBS-CT",
		NamaProduk: "TBS Contract Test",
		Kategori:   "TBS",
		IsActive:   true,
	}
	if err := db.Create(&product).Error; err != nil {
		t.Fatalf("failed to seed product: %v", err)
	}

	unit := database.MasterUnit{
		NomorPolisi:   "B 9876 CT",
		NamaKendaraan: "Truk Contract",
		IsActive:      true,
	}
	if err := db.Create(&unit).Error; err != nil {
		t.Fatalf("failed to seed unit: %v", err)
	}

	estateA := database.MasterEstate{
		KodeEstate: "EST-CTA",
		NamaEstate: "Estate Contract A",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	if err := db.Create(&estateA).Error; err != nil {
		t.Fatalf("failed to seed estate A: %v", err)
	}

	estateB := database.MasterEstate{
		KodeEstate: "EST-CTB",
		NamaEstate: "Estate Contract B",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	if err := db.Create(&estateB).Error; err != nil {
		t.Fatalf("failed to seed estate B: %v", err)
	}

	afdelingA := database.MasterAfdeling{
		IDEstate:     estateA.ID,
		KodeAfdeling: "AFD-CTA",
		NamaAfdeling: "Afdeling Contract A",
		IsActive:     true,
		DataSource:   database.MasterDataSourceManual,
	}
	if err := db.Create(&afdelingA).Error; err != nil {
		t.Fatalf("failed to seed afdeling A: %v", err)
	}

	afdelingB := database.MasterAfdeling{
		IDEstate:     estateB.ID,
		KodeAfdeling: "AFD-CTB",
		NamaAfdeling: "Afdeling Contract B",
		IsActive:     true,
		DataSource:   database.MasterDataSourceManual,
	}
	if err := db.Create(&afdelingB).Error; err != nil {
		t.Fatalf("failed to seed afdeling B: %v", err)
	}

	blokA := database.MasterBlok{
		IDAfdeling: afdelingA.ID,
		KodeBlok:   "BLK-CTA",
		NamaBlok:   "Blok Contract A",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	if err := db.Create(&blokA).Error; err != nil {
		t.Fatalf("failed to seed blok A: %v", err)
	}

	blokB := database.MasterBlok{
		IDAfdeling: afdelingB.ID,
		KodeBlok:   "BLK-CTB",
		NamaBlok:   "Blok Contract B",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	if err := db.Create(&blokB).Error; err != nil {
		t.Fatalf("failed to seed blok B: %v", err)
	}

	return appPKSContractSeed{
		OperatorID:   user.ID,
		ProductTBSID: product.ID,
		UnitID:       unit.ID,
		EstateAID:    estateA.ID,
		EstateBID:    estateB.ID,
		AfdelingAID:  afdelingA.ID,
		AfdelingBID:  afdelingB.ID,
		BlokAID:      blokA.ID,
		BlokBID:      blokB.ID,
	}
}
