package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// CustomerSeeder handles customer master data seeding
type CustomerSeeder struct{}

// Name returns the name of this seeder
func (s *CustomerSeeder) Name() string {
	return "Customers"
}

// Dependencies returns the list of seeders that must run before this one
func (s *CustomerSeeder) Dependencies() []string {
	return []string{} // No dependencies
}

// Run executes the customer seeding logic
func (s *CustomerSeeder) Run(db *gorm.DB) error {
	// Check if customers already exist
	var count int64
	if err := db.Model(&MasterCustomer{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check existing customers: %w", err)
	}

	// If customers already exist, skip seeding
	if count > 0 {
		log.Printf("Found %d existing customers, skipping customer seeding", count)
		return nil
	}

	log.Println("No existing customers found, creating seed customers...")

	// Define customer seed data
	customers := []MasterCustomer{
		{
			KodeCustomer:  "CUST-001",
			NamaCustomer:  "PT Global Palm Oil Industry",
			Alamat:        "Jl. Industri Raya No. 100, Jakarta Utara",
			Telepon:       "021-12345678",
			Email:         "procurement@globalpalmoi.com",
			JenisCustomer: "BUYER_CPO",
			IsActive:      true,
		},
		{
			KodeCustomer:  "CUST-002",
			NamaCustomer:  "PT Minyak Sawit Nusantara",
			Alamat:        "Kompleks Industrial Estate Blok C-15, Surabaya",
			Telepon:       "031-87654321",
			Email:         "purchasing@minyaksawit.co.id",
			JenisCustomer: "BUYER_CPO",
			IsActive:      true,
		},
		{
			KodeCustomer:  "CUST-003",
			NamaCustomer:  "CV Kernel Export Indonesia",
			Alamat:        "Jl. Pelabuhan Tanjung Priok No. 88, Jakarta",
			Telepon:       "021-99887766",
			Email:         "export@kernelindo.com",
			JenisCustomer: "BUYER_KERNEL",
			IsActive:      true,
		},
		{
			KodeCustomer:  "CUST-004",
			NamaCustomer:  "PT Agro Trading Mandiri",
			Alamat:        "Jl. Raya Medan-Binjai KM 12, Medan",
			Telepon:       "061-55443322",
			Email:         "sales@agrotrading.co.id",
			JenisCustomer: "DISTRIBUTOR",
			IsActive:      true,
		},
		{
			KodeCustomer:  "CUST-005",
			NamaCustomer:  "PT Refined Palm Products",
			Alamat:        "Kawasan Industri MM2100 Blok LL-7, Bekasi",
			Telepon:       "021-33221100",
			Email:         "procurement@refinedpalm.com",
			JenisCustomer: "BUYER_CPO",
			IsActive:      true,
		},
		{
			KodeCustomer:  "CUST-006",
			NamaCustomer:  "CV Sawit Jaya Export",
			Alamat:        "Jl. Pelabuhan Dumai No. 45, Dumai, Riau",
			Telepon:       "0765-77889900",
			Email:         "info@sawitjayaexport.com",
			JenisCustomer: "DISTRIBUTOR",
			IsActive:      true,
		},
		{
			KodeCustomer:  "CUST-007",
			NamaCustomer:  "PT Kernel Processing International",
			Alamat:        "Jl. Industri Makassar No. 200, Makassar",
			Telepon:       "0411-66554433",
			Email:         "purchasing@kernelprocessing.co.id",
			JenisCustomer: "BUYER_KERNEL",
			IsActive:      true,
		},
		{
			KodeCustomer:  "CUST-008",
			NamaCustomer:  "PT Mega Palm Industry",
			Alamat:        "Jl. Jend. Sudirman Kav. 25, Jakarta Selatan",
			Telepon:       "021-11223344",
			Email:         "procurement@megapalm.com",
			JenisCustomer: "BUYER_CPO",
			IsActive:      true,
		},
	}

	// Create customers
	for _, customer := range customers {
		if err := db.Create(&customer).Error; err != nil {
			return fmt.Errorf("failed to create customer %s: %w", customer.KodeCustomer, err)
		}
		log.Printf("Created customer: %s - %s (%s)", customer.KodeCustomer, customer.NamaCustomer, customer.JenisCustomer)
	}

	log.Printf("Successfully created %d seed customers", len(customers))
	return nil
}
