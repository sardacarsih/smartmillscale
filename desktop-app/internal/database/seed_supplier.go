package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// SupplierSeeder handles supplier master data seeding
type SupplierSeeder struct{}

// Name returns the name of this seeder
func (s *SupplierSeeder) Name() string {
	return "Suppliers"
}

// Dependencies returns the list of seeders that must run before this one
func (s *SupplierSeeder) Dependencies() []string {
	return []string{} // No dependencies
}

// Run executes the supplier seeding logic
func (s *SupplierSeeder) Run(db *gorm.DB) error {
	// Check if suppliers already exist
	var count int64
	if err := db.Model(&MasterSupplier{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check existing suppliers: %w", err)
	}

	// If suppliers already exist, skip seeding
	if count > 0 {
		log.Printf("Found %d existing suppliers, skipping supplier seeding", count)
		return nil
	}

	log.Println("No existing suppliers found, creating seed suppliers...")

	// Define supplier seed data
	suppliers := []MasterSupplier{
		{
			KodeSupplier:  "SUP-001",
			NamaSupplier:  "PT Agro Mandiri",
			Alamat:        "Jl. Raya Pekanbaru No. 123, Riau",
			Kontak:        "0761-12345678",
			JenisSupplier: "AGEN",
			IsActive:      true,
		},
		{
			KodeSupplier:  "SUP-002",
			NamaSupplier:  "CV Sumber Tani Jaya",
			Alamat:        "Jl. Pasar Kampar No. 45, Kampar",
			Kontak:        "0762-87654321",
			JenisSupplier: "PETANI",
			IsActive:      true,
		},
		{
			KodeSupplier:  "SUP-003",
			NamaSupplier:  "Koperasi Plasma Sejahtera",
			Alamat:        "Desa Plasma Utama, Riau",
			Kontak:        "0761-99887766",
			JenisSupplier: "PLASMA",
			IsActive:      true,
		},
		{
			KodeSupplier:  "SUP-004",
			NamaSupplier:  "PT Berkah Sawit Nusantara",
			Alamat:        "Kompleks Industrial Area, Dumai",
			Kontak:        "0765-11223344",
			JenisSupplier: "AGEN",
			IsActive:      true,
		},
		{
			KodeSupplier:  "SUP-005",
			NamaSupplier:  "Kelompok Tani Harapan Maju",
			Alamat:        "Desa Suka Maju, Kampar, Riau",
			Kontak:        "0762-55443322",
			JenisSupplier: "PETANI",
			IsActive:      true,
		},
		{
			KodeSupplier:  "SUP-006",
			NamaSupplier:  "CV Sawit Makmur",
			Alamat:        "Jl. Lintas Sumatra KM 45, Pekanbaru",
			Kontak:        "0761-66778899",
			JenisSupplier: "AGEN",
			IsActive:      true,
		},
		{
			KodeSupplier:  "SUP-007",
			NamaSupplier:  "Koperasi Plasma Riau Jaya",
			Alamat:        "Jl. Plasma Estate No. 88, Riau",
			Kontak:        "0761-33221100",
			JenisSupplier: "PLASMA",
			IsActive:      true,
		},
		{
			KodeSupplier:  "SUP-008",
			NamaSupplier:  "PT Mitra Sawit Perdana",
			Alamat:        "Jl. Industri Raya No. 200, Pekanbaru",
			Kontak:        "0761-77889900",
			JenisSupplier: "AGEN",
			IsActive:      true,
		},
	}

	// Create suppliers
	for _, supplier := range suppliers {
		if err := db.Create(&supplier).Error; err != nil {
			return fmt.Errorf("failed to create supplier %s: %w", supplier.KodeSupplier, err)
		}
		log.Printf("Created supplier: %s - %s (%s)", supplier.KodeSupplier, supplier.NamaSupplier, supplier.JenisSupplier)
	}

	log.Printf("Successfully created %d seed suppliers", len(suppliers))
	return nil
}
