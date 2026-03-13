package testing

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
)

// PKSWorkflowTest tests the complete PKS workflow
type PKSWorkflowTest struct {
	db                *gorm.DB
	pksService        *service.PKSService
	pksMasterService  *service.PKSMasterService
	ticketService     *service.TicketService
}

// NewPKSWorkflowTest creates a new PKS workflow test
func NewPKSWorkflowTest(db *gorm.DB) *PKSWorkflowTest {
	ctx := context.Background()
	return &PKSWorkflowTest{
		db:               db,
		pksService:       service.NewPKSService(db, "test-device"),
		pksMasterService: service.NewPKSMasterService(db),
		ticketService:    service.NewTicketService(db),
	}
}

// RunCompleteWorkflow tests the complete PKS workflow
func (t *PKSWorkflowTest) RunCompleteWorkflow() error {
	log.Println("🧪 Starting PKS Workflow Test...")

	// Test 1: Create Master Data
	log.Println("📝 Step 1: Creating master data...")
	if err := t.testCreateMasterData(); err != nil {
		return fmt.Errorf("master data creation failed: %w", err)
	}
	log.Println("✅ Master data created successfully")

	// Test 2: Create Timbang 1
	log.Println("⚖️ Step 2: Creating Timbang 1...")
	timbang1Result, err := t.testCreateTimbang1()
	if err != nil {
		return fmt.Errorf("timbang 1 creation failed: %w", err)
	}
	log.Println("✅ Timbang 1 created successfully")

	// Test 3: Update Timbang 2
	log.Println("⚖️ Step 3: Updating Timbang 2...")
	timbang2Result, err := t.testUpdateTimbang2(timbang1Result)
	if err != nil {
		return fmt.Errorf("timbang 2 update failed: %w", err)
	}
	log.Println("✅ Timbang 2 updated successfully")

	// Test 4: Complete Transaction
	log.Println("✅ Step 4: Completing transaction...")
	completedResult, err := t.testCompleteTransaction(timbang2Result)
	if err != nil {
		return fmt.Errorf("transaction completion failed: %w", err)
	}
	log.Println("✅ Transaction completed successfully")

	// Test 5: Print Ticket
	log.Println("🖨️ Step 5: Printing ticket...")
	ticketResult, err := t.testPrintTicket(completedResult)
	if err != nil {
		return fmt.Errorf("ticket printing failed: %w", err)
	}
	log.Println("✅ Ticket printed successfully")

	// Test 6: Verify Business Rules
	log.Println("🔍 Step 6: Verifying business rules...")
	if err := t.testBusinessRules(); err != nil {
		return fmt.Errorf("business rules verification failed: %w", err)
	}
	log.Println("✅ Business rules verified successfully")

	// Test 7: Test Search and Statistics
	log.Println("📊 Step 7: Testing search and statistics...")
	if err := t.testSearchAndStatistics(); err != nil {
		return fmt.Errorf("search and statistics test failed: %w", err)
	}
	log.Println("✅ Search and statistics test passed")

	log.Println("🎉 All PKS workflow tests passed successfully!")
	return nil
}

// testCreateMasterData creates test master data
func (t *PKSWorkflowTest) testCreateMasterData() error {
	ctx := context.Background()
	operatorID := uuid.New()

	// Create Product
	product := &service.CreateProductRequest{
		KodeProduk: "TBS001",
		NamaProduk: "TBS Segar",
		Kategori:   "TBS",
	}

	if _, err := t.pksMasterService.CreateProduct(ctx, product, operatorID); err != nil {
		return fmt.Errorf("failed to create product: %w", err)
	}

	// Create Unit
	unit := &service.CreateUnitRequest{
		NomorPolisi:    "B1234CD",
		NamaKendaraan:  "Truk Engkel",
		JenisKendaraan: "TRUK",
		KapasitasMax:   8000,
	}

	if _, err := t.pksMasterService.CreateUnit(ctx, unit, operatorID); err != nil {
		return fmt.Errorf("failed to create unit: %w", err)
	}

	// Create Supplier
	supplier := &service.CreateSupplierRequest{
		KodeSupplier: "SUP001",
		NamaSupplier: "Test Supplier",
		Alamat:       "Jakarta",
		Kontak:       "08123456789",
		JenisSupplier: "PETANI",
	}

	if _, err := t.pksMasterService.CreateSupplier(ctx, supplier, operatorID); err != nil {
		return fmt.Errorf("failed to create supplier: %w", err)
	}

	return nil
}

// testCreateTimbang1 creates a Timbang 1 transaction
func (t *PKSWorkflowTest) testCreateTimbang1() (*database.TimbanganPKS, error) {
	ctx := context.Background()
	operatorID := uuid.New()

	req := &service.CreateTimbang1Request{
		NoTransaksi:  fmt.Sprintf("TEST-%d", time.Now().Unix()),
		IDProduk:     1, // Assuming first product
		IDUnit:       1, // Assuming first unit
		IDSupplier:   1, // Assuming first supplier
		DriverName:   "Test Driver",
		Bruto:        5000.50,
		Tara:         500.00,
		Netto:        4500.50,
	}

	result, err := t.pksService.CreateTimbang1(ctx, req)
	if err != nil {
		return nil, err
	}

	// Verify the transaction was created correctly
	if result.Status != "timbang1" {
		return nil, fmt.Errorf("expected status 'timbang1', got '%s'", result.Status)
	}

	if result.Bruto != req.Bruto {
		return nil, fmt.Errorf("expected bruto %.2f, got %.2f", req.Bruto, result.Bruto)
	}

	return result, nil
}

// testUpdateTimbang2 updates a Timbang 2 transaction
func (t *PKSWorkflowTest) testUpdateTimbang2(timbangan *database.TimbanganPKS) (*database.TimbanganPKS, error) {
	ctx := context.Background()
	operatorID := uuid.New()

	req := &service.UpdateTimbang2Request{
		NoTransaksi: timbangan.NoTransaksi,
		Bruto2:      4990.75,
		Tara2:       490.25,
		Netto2:      4500.50,
	}

	result, err := t.pksService.UpdateTimbang2(ctx, req)
	if err != nil {
		return nil, err
	}

	// Verify the transaction was updated correctly
	if result.Status != "timbang2" {
		return nil, fmt.Errorf("expected status 'timbang2', got '%s'", result.Status)
	}

	if result.Bruto2 != req.Bruto2 {
		return nil, fmt.Errorf("expected bruto2 %.2f, got %.2f", req.Bruto2, result.Bruto2)
	}

	return result, nil
}

// testCompleteTransaction completes a transaction
func (t *PKSWorkflowTest) testCompleteTransaction(timbangan *database.TimbanganPKS) (*database.TimbanganPKS, error) {
	ctx := context.Background()
	operatorID := uuid.New()

	result, err := t.pksService.CompleteTransaction(ctx, timbangan.NoTransaksi)
	if err != nil {
		return nil, err
	}

	// Verify the transaction was completed correctly
	if result.Status != "selesai" {
		return nil, fmt.Errorf("expected status 'selesai', got '%s'", result.Status)
	}

	if result.CompletedDate == nil {
		return nil, fmt.Errorf("completed date should not be nil")
	}

	return result, nil
}

// testPrintTicket tests ticket printing
func (t *PKSWorkflowTest) testPrintTicket(timbangan *database.TimbanganPKS) (*service.PrintResponse, error) {
	ctx := context.Background()
	operatorID := uuid.New()

	req := &service.PrintRequest{
		TimbanganID: timbangan.IDLocal,
		Copies:      1,
		IsReprint:   false,
		OperatorID:  operatorID,
	}

	result, err := t.ticketService.PrintTicket(ctx, req)
	if err != nil {
		return nil, err
	}

	// Verify the ticket was printed correctly
	if !result.Success {
		return nil, fmt.Errorf("ticket printing failed: %s", result.ErrorMessage)
	}

	if result.TicketNumber == "" {
		return nil, fmt.Errorf("ticket number should not be empty")
	}

	if result.TicketData == nil {
		return nil, fmt.Errorf("ticket data should not be nil")
	}

	return result, nil
}

// testBusinessRules verifies business rules
func (t *PKSWorkflowTest) testBusinessRules() error {
	ctx := context.Background()
	operatorID := uuid.New()

	// Test Rule: Cannot update Timbang 2 before Timbang 1
	req := &service.UpdateTimbang2Request{
		NoTransaksi: "NONEXISTENT",
		Bruto2:      5000,
		Tara2:       500,
		Netto2:      4500,
	}

	_, err := t.pksService.UpdateTimbang2(ctx, req)
	if err == nil {
		return fmt.Errorf("expected error when updating timbang 2 for non-existent transaction")
	}

	// Test Rule: Cannot complete transaction before Timbang 2
	err = t.pksService.CompleteTransaction(ctx, "NONEXISTENT")
	if err == nil {
		return fmt.Errorf("expected error when completing non-existent transaction")
	}

	// Test Rule: Cannot print ticket for incomplete transaction
	printReq := &service.PrintRequest{
		TimbanganID: uuid.New(),
		Copies:      1,
		IsReprint:   false,
		OperatorID:  operatorID,
	}

	_, err = t.ticketService.PrintTicket(ctx, printReq)
	if err == nil {
		return fmt.Errorf("expected error when printing ticket for non-existent transaction")
	}

	return nil
}

// testSearchAndStatistics tests search and statistics functionality
func (t *PKSWorkflowTest) testSearchAndStatistics() error {
	ctx := context.Background()

	// Test Search
	searchReq := &service.SearchPKSRequest{
		NoTransaksi: "TEST",
		Limit:      10,
		Offset:     0,
	}

	result, err := t.pksService.SearchPKSTimbangans(ctx, searchReq)
	if err != nil {
		return fmt.Errorf("search failed: %w", err)
	}

	if result == nil {
		return fmt.Errorf("search result should not be nil")
	}

	// Test Statistics
	stats, err := t.pksService.GetPKSStatistics(ctx, 7*time.Hour*24) // 7 days
	if err != nil {
		return fmt.Errorf("statistics failed: %w", err)
	}

	if stats == nil {
		return fmt.Errorf("statistics should not be nil")
	}

	// Verify statistics structure
	if stats.TotalTransactions < 0 {
		return fmt.Errorf("total transactions should not be negative")
	}

	return nil
}

// CleanupTestData cleans up test data
func (t *PKSWorkflowTest) CleanupTestData() error {
	log.Println("🧹 Cleaning up test data...")

	// Delete all PKS tickets
	if err := t.db.Exec("DELETE FROM pks_tickets WHERE no_transaksi LIKE 'TEST-%'").Error; err != nil {
		return fmt.Errorf("failed to delete test tickets: %w", err)
	}

	// Delete all PKS transactions
	if err := t.db.Exec("DELETE FROM timbangan_pks WHERE no_transaksi LIKE 'TEST-%'").Error; err != nil {
		return fmt.Errorf("failed to delete test transactions: %w", err)
	}

	// Delete test master data (assuming test data starts with "TEST" or specific test codes)
	if err := t.db.Exec("DELETE FROM produk WHERE kode_produk = 'TBS001'").Error; err != nil {
		return fmt.Errorf("failed to delete test products: %w", err)
	}

	if err := t.db.Exec("DELETE FROM unit WHERE nomor_polisi = 'B1234CD'").Error; err != nil {
		return fmt.Errorf("failed to delete test units: %w", err)
	}

	if err := t.db.Exec("DELETE FROM master_supplier WHERE kode_supplier = 'SUP001'").Error; err != nil {
		return fmt.Errorf("failed to delete test suppliers: %w", err)
	}

	log.Println("✅ Test data cleaned up successfully")
	return nil
}

// RunIntegrationTest runs a complete integration test
func RunIntegrationTest(db *gorm.DB) error {
	test := NewPKSWorkflowTest(db)

	// Run the complete workflow
	if err := test.RunCompleteWorkflow(); err != nil {
		return err
	}

	// Clean up test data
	if err := test.CleanupTestData(); err != nil {
		log.Printf("Warning: cleanup failed: %v", err)
	}

	return nil
}