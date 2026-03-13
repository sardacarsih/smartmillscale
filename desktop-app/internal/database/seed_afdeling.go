package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// AfdelingSeeder handles afdeling master data seeding
type AfdelingSeeder struct{}

// Name returns the name of this seeder
func (s *AfdelingSeeder) Name() string {
	return "Afdelings"
}

// Dependencies returns the list of seeders that must run before this one
func (s *AfdelingSeeder) Dependencies() []string {
	return []string{"Estates"} // Must run after estates
}

// Run executes the afdeling seeding logic
func (s *AfdelingSeeder) Run(db *gorm.DB) error {
	// Check if afdelings already exist
	var count int64
	if err := db.Model(&MasterAfdeling{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check existing afdelings: %w", err)
	}

	// If afdelings already exist, skip seeding
	if count > 0 {
		log.Printf("Found %d existing afdelings, skipping afdeling seeding", count)
		return nil
	}

	log.Println("No existing afdelings found, creating seed afdelings...")

	// Get estates to reference their IDs
	var estates []MasterEstate
	if err := db.Find(&estates).Error; err != nil {
		return fmt.Errorf("failed to fetch estates: %w", err)
	}

	if len(estates) < 2 {
		log.Println("Not enough estates found, skipping afdeling seeding")
		return nil
	}

	// Define afdeling seed data
	afdelings := []MasterAfdeling{
		// Afdelings for Estate Riau Utara (first estate)
		{
			IDEstate:     estates[0].ID,
			KodeAfdeling: "AFD-A",
			NamaAfdeling: "Afdeling A",
			Luas:         1200.00,
			IsActive:     true,
		},
		{
			IDEstate:     estates[0].ID,
			KodeAfdeling: "AFD-B",
			NamaAfdeling: "Afdeling B",
			Luas:         1500.00,
			IsActive:     true,
		},
		{
			IDEstate:     estates[0].ID,
			KodeAfdeling: "AFD-C",
			NamaAfdeling: "Afdeling C",
			Luas:         2300.00,
			IsActive:     true,
		},
		// Afdelings for Estate Jambi Selatan (second estate)
		{
			IDEstate:     estates[1].ID,
			KodeAfdeling: "AFD-D",
			NamaAfdeling: "Afdeling D",
			Luas:         1000.00,
			IsActive:     true,
		},
		{
			IDEstate:     estates[1].ID,
			KodeAfdeling: "AFD-E",
			NamaAfdeling: "Afdeling E",
			Luas:         1800.00,
			IsActive:     true,
		},
		{
			IDEstate:     estates[1].ID,
			KodeAfdeling: "AFD-F",
			NamaAfdeling: "Afdeling F",
			Luas:         1700.00,
			IsActive:     true,
		},
	}

	// Create afdelings
	for _, afdeling := range afdelings {
		if err := db.Create(&afdeling).Error; err != nil {
			return fmt.Errorf("failed to create afdeling %s: %w", afdeling.KodeAfdeling, err)
		}
		log.Printf("Created afdeling: %s - %s (%.0f ha)", afdeling.KodeAfdeling, afdeling.NamaAfdeling, afdeling.Luas)
	}

	log.Printf("Successfully created %d seed afdelings", len(afdelings))
	return nil
}
