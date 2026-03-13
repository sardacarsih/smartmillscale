package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// EstateSeeder handles estate master data seeding
type EstateSeeder struct{}

// Name returns the name of this seeder
func (s *EstateSeeder) Name() string {
	return "Estates"
}

// Dependencies returns the list of seeders that must run before this one
func (s *EstateSeeder) Dependencies() []string {
	return []string{} // No dependencies
}

// Run executes the estate seeding logic
func (s *EstateSeeder) Run(db *gorm.DB) error {
	// Check if estates already exist
	var count int64
	if err := db.Model(&MasterEstate{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check existing estates: %w", err)
	}

	// If estates already exist, skip seeding
	if count > 0 {
		log.Printf("Found %d existing estates, skipping estate seeding", count)
		return nil
	}

	log.Println("No existing estates found, creating seed estates...")

	// Define estate seed data
	estates := []MasterEstate{
		{
			KodeEstate: "EST-RIAU-001",
			NamaEstate: "Perkebunan Riau Utara",
			Luas:       5000.00,
			Lokasi:     "Kabupaten Kampar, Riau",
			IsActive:   true,
		},
		{
			KodeEstate: "EST-JAMBI-001",
			NamaEstate: "Perkebunan Jambi Selatan",
			Luas:       4500.00,
			Lokasi:     "Kabupaten Batanghari, Jambi",
			IsActive:   true,
		},
	}

	// Create estates
	for _, estate := range estates {
		if err := db.Create(&estate).Error; err != nil {
			return fmt.Errorf("failed to create estate %s: %w", estate.KodeEstate, err)
		}
		log.Printf("Created estate: %s - %s (%.0f ha)", estate.KodeEstate, estate.NamaEstate, estate.Luas)
	}

	log.Printf("Successfully created %d seed estates", len(estates))
	return nil
}
