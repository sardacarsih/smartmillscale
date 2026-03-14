package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	_ "modernc.org/sqlite"
)

func TestCreateTimbang1_TBS_AllowsOptionalBlockDetails(t *testing.T) {
	t.Parallel()

	db := openPKSServiceTestDB(t, "tbs_optional_blocks")
	seed := seedPKSServiceMasterData(t, db)
	svc := newPKSServiceForTest(db, seed.UserID)

	req := &CreateTimbang1Request{
		NoTransaksi: "TRS-TBS-OPTIONAL-" + time.Now().Format("150405.000"),
		IDProduk:    seed.TBSProductID,
		IDUnit:      seed.UnitID,
		DriverName:  "Driver TBS Optional",
		SumberTBS:   "Kebun Internal",
		Grade:       "A",
		Bruto:       1000,
		Tara:        100,
		Netto:       900,
	}

	result, err := svc.CreateTimbang1(context.Background(), req)
	if err != nil {
		t.Fatalf("CreateTimbang1 returned error: %v", err)
	}
	if result == nil {
		t.Fatal("expected transaction result, got nil")
	}
	if result.IDEstate != nil || result.IDAfdeling != nil || result.IDBlok != nil {
		t.Fatalf("expected legacy TBS header refs to remain nil, got estate=%v afdeling=%v blok=%v", result.IDEstate, result.IDAfdeling, result.IDBlok)
	}
	if len(result.TBSBlockDetails) != 0 {
		t.Fatalf("expected no TBS block details, got %d", len(result.TBSBlockDetails))
	}
}

func TestCreateTimbang1_TBS_PersistsMultiBlockCrossAfdelingDetails(t *testing.T) {
	t.Parallel()

	db := openPKSServiceTestDB(t, "tbs_cross_afdeling")
	seed := seedPKSServiceMasterData(t, db)
	svc := newPKSServiceForTest(db, seed.UserID)

	req := &CreateTimbang1Request{
		NoTransaksi: "TRS-TBS-MULTI-" + time.Now().Format("150405.000"),
		IDProduk:    seed.TBSProductID,
		IDUnit:      seed.UnitID,
		DriverName:  "Driver Campuran",
		SumberTBS:   "Campuran Kebun",
		Grade:       "B",
		TBSBlockDetails: []CreateTBSBlockDetailRequestItem{
			{IDBlok: seed.BlokAID, Janjang: 15, BrondolanKg: 12.5},
			{IDBlok: seed.BlokBID, Janjang: 10, BrondolanKg: 3.25},
		},
		Bruto: 1200,
		Tara:  200,
		Netto: 1000,
	}

	result, err := svc.CreateTimbang1(context.Background(), req)
	if err != nil {
		t.Fatalf("CreateTimbang1 returned error: %v", err)
	}
	if result == nil {
		t.Fatal("expected transaction result, got nil")
	}
	if len(result.TBSBlockDetails) != 2 {
		t.Fatalf("expected 2 TBS block details, got %d", len(result.TBSBlockDetails))
	}

	var persisted []database.TimbanganPKSTBSBlockDetail
	if err := db.Preload("Blok").Preload("Afdeling").Preload("Estate").
		Where("timbangan_pks_id = ?", result.ID).
		Order("id_blok ASC").
		Find(&persisted).Error; err != nil {
		t.Fatalf("failed to query persisted detail rows: %v", err)
	}
	if len(persisted) != 2 {
		t.Fatalf("expected 2 persisted detail rows, got %d", len(persisted))
	}

	byBlockID := make(map[uint]database.TimbanganPKSTBSBlockDetail, len(persisted))
	for i := range persisted {
		byBlockID[persisted[i].IDBlok] = persisted[i]
	}

	rowA, ok := byBlockID[seed.BlokAID]
	if !ok {
		t.Fatalf("expected detail for blok A (id=%d)", seed.BlokAID)
	}
	if rowA.IDAfdeling != seed.AfdelingAID || rowA.IDEstate != seed.EstateAID {
		t.Fatalf("unexpected lineage for blok A: estate=%d afdeling=%d", rowA.IDEstate, rowA.IDAfdeling)
	}
	if rowA.Janjang != 15 || rowA.BrondolanKg != 12.5 {
		t.Fatalf("unexpected values for blok A: janjang=%d brondolan=%v", rowA.Janjang, rowA.BrondolanKg)
	}

	rowB, ok := byBlockID[seed.BlokBID]
	if !ok {
		t.Fatalf("expected detail for blok B (id=%d)", seed.BlokBID)
	}
	if rowB.IDAfdeling != seed.AfdelingBID || rowB.IDEstate != seed.EstateBID {
		t.Fatalf("unexpected lineage for blok B: estate=%d afdeling=%d", rowB.IDEstate, rowB.IDAfdeling)
	}
	if rowB.Janjang != 10 || rowB.BrondolanKg != 3.25 {
		t.Fatalf("unexpected values for blok B: janjang=%d brondolan=%v", rowB.Janjang, rowB.BrondolanKg)
	}
}

func TestCreateTimbang1_TBS_RejectsDuplicateBlockDetails(t *testing.T) {
	t.Parallel()

	db := openPKSServiceTestDB(t, "tbs_duplicate_block")
	seed := seedPKSServiceMasterData(t, db)
	svc := newPKSServiceForTest(db, seed.UserID)

	req := &CreateTimbang1Request{
		NoTransaksi: "TRS-TBS-DUP-" + time.Now().Format("150405.000"),
		IDProduk:    seed.TBSProductID,
		IDUnit:      seed.UnitID,
		DriverName:  "Driver Duplikat",
		TBSBlockDetails: []CreateTBSBlockDetailRequestItem{
			{IDBlok: seed.BlokAID, Janjang: 5, BrondolanKg: 1},
			{IDBlok: seed.BlokAID, Janjang: 6, BrondolanKg: 2},
		},
		Bruto: 1000,
		Tara:  100,
		Netto: 900,
	}

	_, err := svc.CreateTimbang1(context.Background(), req)
	if err == nil {
		t.Fatal("expected duplicate blok validation error, got nil")
	}
	if !strings.Contains(err.Error(), "duplikat") {
		t.Fatalf("expected duplicate error message, got: %v", err)
	}
}

func TestCreateTimbang1_NonTBS_RejectsTBSBlockDetails(t *testing.T) {
	t.Parallel()

	db := openPKSServiceTestDB(t, "nontbs_reject_tbs_details")
	seed := seedPKSServiceMasterData(t, db)
	svc := newPKSServiceForTest(db, seed.UserID)

	req := &CreateTimbang1Request{
		NoTransaksi: "TRS-NON-TBS-" + time.Now().Format("150405.000"),
		IDProduk:    seed.NonTBSProductID,
		IDUnit:      seed.UnitID,
		IDSupplier:  &seed.SupplierID,
		DriverName:  "Driver Non TBS",
		TBSBlockDetails: []CreateTBSBlockDetailRequestItem{
			{IDBlok: seed.BlokAID, Janjang: 3, BrondolanKg: 0.5},
		},
		Bruto: 800,
		Tara:  100,
		Netto: 700,
	}

	_, err := svc.CreateTimbang1(context.Background(), req)
	if err == nil {
		t.Fatal("expected non-TBS validation error, got nil")
	}
	if !strings.Contains(err.Error(), "tidak boleh diisi") {
		t.Fatalf("expected non-TBS guard error message, got: %v", err)
	}
}

type pksServiceTestSeed struct {
	UserID          uuid.UUID
	TBSProductID    uint
	NonTBSProductID uint
	UnitID          uint
	SupplierID      uint
	EstateAID       uint
	EstateBID       uint
	AfdelingAID     uint
	AfdelingBID     uint
	BlokAID         uint
	BlokBID         uint
}

func openPKSServiceTestDB(t *testing.T, suffix string) *gorm.DB {
	t.Helper()

	dsn := "file:pks_service_" + suffix + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Dialector{DriverName: "sqlite", DSN: dsn}, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
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
		t.Fatalf("failed to migrate test schema: %v", err)
	}

	return db
}

func seedPKSServiceMasterData(t *testing.T, db *gorm.DB) pksServiceTestSeed {
	t.Helper()

	user := auth.User{
		ID:           uuid.New(),
		Username:     "operator-test",
		PasswordHash: "hash",
		FullName:     "Operator Test",
		Role:         auth.RoleTimbangan,
		IsActive:     true,
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	produkTBS := database.MasterProduk{
		KodeProduk: "TBS-01",
		NamaProduk: "TBS Segar",
		Kategori:   "TBS",
		IsActive:   true,
	}
	if err := db.Create(&produkTBS).Error; err != nil {
		t.Fatalf("failed to seed TBS product: %v", err)
	}

	produkCPO := database.MasterProduk{
		KodeProduk: "CPO-01",
		NamaProduk: "Crude Palm Oil",
		Kategori:   "CPO",
		IsActive:   true,
	}
	if err := db.Create(&produkCPO).Error; err != nil {
		t.Fatalf("failed to seed non-TBS product: %v", err)
	}

	unit := database.MasterUnit{
		NomorPolisi:   "B 1234 TEST",
		NamaKendaraan: "Truk Uji",
		IsActive:      true,
	}
	if err := db.Create(&unit).Error; err != nil {
		t.Fatalf("failed to seed unit: %v", err)
	}

	supplier := database.MasterSupplier{
		KodeSupplier: "SUP-01",
		NamaSupplier: "Supplier Uji",
		IsActive:     true,
	}
	if err := db.Create(&supplier).Error; err != nil {
		t.Fatalf("failed to seed supplier: %v", err)
	}

	estateA := database.MasterEstate{
		KodeEstate: "EST-A",
		NamaEstate: "Estate A",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	if err := db.Create(&estateA).Error; err != nil {
		t.Fatalf("failed to seed estate A: %v", err)
	}

	estateB := database.MasterEstate{
		KodeEstate: "EST-B",
		NamaEstate: "Estate B",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	if err := db.Create(&estateB).Error; err != nil {
		t.Fatalf("failed to seed estate B: %v", err)
	}

	afdelingA := database.MasterAfdeling{
		IDEstate:     estateA.ID,
		KodeAfdeling: "AFD-A",
		NamaAfdeling: "Afdeling A",
		IsActive:     true,
		DataSource:   database.MasterDataSourceManual,
	}
	if err := db.Create(&afdelingA).Error; err != nil {
		t.Fatalf("failed to seed afdeling A: %v", err)
	}

	afdelingB := database.MasterAfdeling{
		IDEstate:     estateB.ID,
		KodeAfdeling: "AFD-B",
		NamaAfdeling: "Afdeling B",
		IsActive:     true,
		DataSource:   database.MasterDataSourceManual,
	}
	if err := db.Create(&afdelingB).Error; err != nil {
		t.Fatalf("failed to seed afdeling B: %v", err)
	}

	blokA := database.MasterBlok{
		IDAfdeling: afdelingA.ID,
		KodeBlok:   "BLK-A",
		NamaBlok:   "Blok A",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	if err := db.Create(&blokA).Error; err != nil {
		t.Fatalf("failed to seed blok A: %v", err)
	}

	blokB := database.MasterBlok{
		IDAfdeling: afdelingB.ID,
		KodeBlok:   "BLK-B",
		NamaBlok:   "Blok B",
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}
	if err := db.Create(&blokB).Error; err != nil {
		t.Fatalf("failed to seed blok B: %v", err)
	}

	return pksServiceTestSeed{
		UserID:          user.ID,
		TBSProductID:    produkTBS.ID,
		NonTBSProductID: produkCPO.ID,
		UnitID:          unit.ID,
		SupplierID:      supplier.ID,
		EstateAID:       estateA.ID,
		EstateBID:       estateB.ID,
		AfdelingAID:     afdelingA.ID,
		AfdelingBID:     afdelingB.ID,
		BlokAID:         blokA.ID,
		BlokBID:         blokB.ID,
	}
}

func newPKSServiceForTest(db *gorm.DB, userID uuid.UUID) *PKSService {
	svc := NewPKSService(db, "test-device")
	svc.SetCurrentUser(userID)
	return svc
}
