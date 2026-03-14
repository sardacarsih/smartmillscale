package testing

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
	_ "modernc.org/sqlite"
)

func TestPKSWorkflow_CompleteLifecycle(t *testing.T) {
	ctx := context.Background()
	db := openWorkflowTestDB(t)

	operator := auth.User{
		ID:           uuid.New(),
		Username:     "workflow-operator",
		PasswordHash: "hash",
		FullName:     "Workflow Operator",
		Role:         auth.RoleTimbangan,
		IsActive:     true,
	}
	if err := db.Create(&operator).Error; err != nil {
		t.Fatalf("failed to seed operator: %v", err)
	}

	masterSvc := service.NewPKSMasterService(db)
	pksSvc := service.NewPKSService(db, "workflow-device")
	pksSvc.SetCurrentUser(operator.ID)

	product, err := masterSvc.CreateProduct(ctx, &service.CreateProductRequest{
		KodeProduk: "WF-CPO",
		NamaProduk: "Workflow CPO",
		Kategori:   "CPO",
	})
	if err != nil {
		t.Fatalf("failed to create product: %v", err)
	}

	unit, err := masterSvc.CreateUnit(ctx, &service.CreateUnitRequest{
		NomorPolisi:    "B 4321 WF",
		NamaKendaraan:  "Truk Workflow",
		JenisKendaraan: "TRUK",
		KapasitasMax:   10000,
	})
	if err != nil {
		t.Fatalf("failed to create unit: %v", err)
	}

	supplier, err := masterSvc.CreateSupplier(ctx, &service.CreateSupplierRequest{
		KodeSupplier:  "WF-SUP",
		NamaSupplier:  "Workflow Supplier",
		Alamat:        "Jakarta",
		Kontak:        "0812345678",
		JenisSupplier: "AGEN",
	})
	if err != nil {
		t.Fatalf("failed to create supplier: %v", err)
	}

	noTransaksi := "WF-" + time.Now().Format("20060102150405.000000")
	createReq := &service.CreateTimbang1Request{
		NoTransaksi: noTransaksi,
		IDProduk:    product.ID,
		IDUnit:      unit.ID,
		IDSupplier:  &supplier.ID,
		DriverName:  "Supir Workflow",
		Bruto:       5000,
		Tara:        900,
		Netto:       4100,
	}

	timbang1, err := pksSvc.CreateTimbang1(ctx, createReq)
	if err != nil {
		t.Fatalf("failed to create timbang1: %v", err)
	}
	if timbang1.Status != "timbang1" {
		t.Fatalf("expected status timbang1, got %s", timbang1.Status)
	}

	timbang2, err := pksSvc.UpdateTimbang2(ctx, &service.UpdateTimbang2Request{
		NoTransaksi: noTransaksi,
		Bruto2:      4990,
		Tara2:       890,
		Netto2:      4100,
	})
	if err != nil {
		t.Fatalf("failed to update timbang2: %v", err)
	}
	if timbang2.Status != "timbang2" {
		t.Fatalf("expected status timbang2, got %s", timbang2.Status)
	}

	completed, err := pksSvc.CompleteTransaction(ctx, noTransaksi)
	if err != nil {
		t.Fatalf("failed to complete transaction: %v", err)
	}
	if completed.Status != "selesai" {
		t.Fatalf("expected status selesai, got %s", completed.Status)
	}

	searchResp, err := pksSvc.SearchPKSTimbangans(ctx, &service.SearchPKSRequest{
		NoTransaksi: "WF-",
		Limit:       10,
		Offset:      0,
	})
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}
	if searchResp.Total < 1 {
		t.Fatalf("expected at least 1 search result, got %d", searchResp.Total)
	}

	stats, err := pksSvc.GetPKSStatistics(ctx, 7*24*time.Hour)
	if err != nil {
		t.Fatalf("stats failed: %v", err)
	}
	if stats.TotalTransactions < 1 {
		t.Fatalf("expected total transactions >= 1, got %d", stats.TotalTransactions)
	}
}

func TestPKSWorkflow_BusinessRule_NonexistentTimbang2(t *testing.T) {
	ctx := context.Background()
	db := openWorkflowTestDB(t)

	svc := service.NewPKSService(db, "workflow-device")
	svc.SetCurrentUser(uuid.New())

	_, err := svc.UpdateTimbang2(ctx, &service.UpdateTimbang2Request{
		NoTransaksi: "WF-NOT-FOUND",
		Bruto2:      100,
		Tara2:       10,
		Netto2:      90,
	})
	if err == nil {
		t.Fatal("expected error when updating non-existent transaction")
	}
}

func openWorkflowTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := "file:pks_workflow_test?mode=memory&cache=shared"
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
		t.Fatalf("failed to migrate workflow schema: %v", err)
	}

	return db
}
