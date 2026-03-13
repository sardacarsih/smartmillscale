package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// ProdukSeeder handles product master data seeding
type ProdukSeeder struct{}

// Name returns the name of this seeder
func (s *ProdukSeeder) Name() string {
	return "Products"
}

// Dependencies returns the list of seeders that must run before this one
func (s *ProdukSeeder) Dependencies() []string {
	return []string{} // No dependencies
}

// Run executes the product seeding logic
func (s *ProdukSeeder) Run(db *gorm.DB) error {
	// Check if products already exist
	var count int64
	if err := db.Model(&MasterProduk{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check existing products: %w", err)
	}

	// If products already exist, skip seeding
	if count > 0 {
		log.Printf("Found %d existing products, skipping product seeding", count)
		return nil
	}

	log.Println("No existing products found, creating seed products...")

	// Define product seed data
	products := []MasterProduk{
		{
			KodeProduk: "TBS-001",
			NamaProduk: "TBS Premium",
			Kategori:   "TBS",
			IsActive:   true,
		},
		{
			KodeProduk: "TBS-002",
			NamaProduk: "TBS Regular",
			Kategori:   "TBS",
			IsActive:   true,
		},
		{
			KodeProduk: "TBS-003",
			NamaProduk: "TBS Restan",
			Kategori:   "TBS",
			IsActive:   true,
		},
		{
			KodeProduk: "CPO-001",
			NamaProduk: "Crude Palm Oil (CPO)",
			Kategori:   "CPO",
			IsActive:   true,
		},
		{
			KodeProduk: "KRN-001",
			NamaProduk: "Palm Kernel",
			Kategori:   "KERNEL",
			IsActive:   true,
		},
		{
			KodeProduk: "PKS-001",
			NamaProduk: "Palm Kernel Shell",
			Kategori:   "LAINNYA",
			IsActive:   true,
		},
		{
			KodeProduk: "PFAD-001",
			NamaProduk: "Palm Fatty Acid Distillate",
			Kategori:   "LAINNYA",
			IsActive:   true,
		},
		{
			KodeProduk: "EFB-001",
			NamaProduk: "Empty Fruit Bunches",
			Kategori:   "LAINNYA",
			IsActive:   true,
		},
		{
			KodeProduk: "PKO-001",
			NamaProduk: "Palm Kernel Oil",
			Kategori:   "LAINNYA",
			IsActive:   true,
		},
		{
			KodeProduk: "CAKE-001",
			NamaProduk: "Palm Kernel Cake",
			Kategori:   "LAINNYA",
			IsActive:   true,
		},
	}

	// Create products
	for _, product := range products {
		if err := db.Create(&product).Error; err != nil {
			return fmt.Errorf("failed to create product %s: %w", product.KodeProduk, err)
		}
		log.Printf("Created product: %s - %s", product.KodeProduk, product.NamaProduk)
	}

	log.Printf("Successfully created %d seed products", len(products))
	return nil
}
