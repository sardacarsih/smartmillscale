package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// BlokSeeder handles block master data seeding
type BlokSeeder struct{}

// Name returns the name of this seeder
func (s *BlokSeeder) Name() string {
	return "Blocks"
}

// Dependencies returns the list of seeders that must run before this one
func (s *BlokSeeder) Dependencies() []string {
	return []string{"Afdelings"} // Must run after afdelings
}

// Run executes the block seeding logic
func (s *BlokSeeder) Run(db *gorm.DB) error {
	// Check if blocks already exist
	var count int64
	if err := db.Model(&MasterBlok{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check existing blocks: %w", err)
	}

	// If blocks already exist, skip seeding
	if count > 0 {
		log.Printf("Found %d existing blocks, skipping block seeding", count)
		return nil
	}

	log.Println("No existing blocks found, creating seed blocks...")

	// Get afdelings to reference their IDs
	var afdelings []MasterAfdeling
	if err := db.Preload("Estate").Find(&afdelings).Error; err != nil {
		return fmt.Errorf("failed to fetch afdelings: %w", err)
	}

	if len(afdelings) < 6 {
		log.Println("Not enough afdelings found, skipping block seeding")
		return nil
	}

	var bloks []MasterBlok

	// Create 3 blocks per afdeling
	blockNames := []string{"01", "02", "03"}
	blockAreas := []float64{250.00, 300.00, 350.00}

	for i, afdeling := range afdelings {
		for j := 0; j < 3; j++ {
			area := blockAreas[j]
			// Adjust block areas for variety
			if i%2 == 0 {
				area += 50.00
			}

			blok := MasterBlok{
				IDAfdeling: afdeling.ID,
				KodeBlok:   afdeling.KodeAfdeling + blockNames[j],
				NamaBlok:   "Blok " + afdeling.KodeAfdeling + blockNames[j],
				Luas:       area,
				IsActive:   true,
			}
			bloks = append(bloks, blok)
		}
	}

	// Create blocks
	for _, blok := range bloks {
		if err := db.Create(&blok).Error; err != nil {
			return fmt.Errorf("failed to create block %s: %w", blok.KodeBlok, err)
		}
		log.Printf("Created block: %s - %s (%.0f ha)", blok.KodeBlok, blok.NamaBlok, blok.Luas)
	}

	log.Printf("Successfully created %d seed blocks", len(bloks))
	return nil
}
