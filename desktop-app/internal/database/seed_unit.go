package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// UnitSeeder handles vehicle/unit master data seeding
type UnitSeeder struct{}

// Name returns the name of this seeder
func (s *UnitSeeder) Name() string {
	return "Units/Vehicles"
}

// Dependencies returns the list of seeders that must run before this one
func (s *UnitSeeder) Dependencies() []string {
	return []string{} // No dependencies
}

// Run executes the unit seeding logic
func (s *UnitSeeder) Run(db *gorm.DB) error {
	// Check if units already exist
	var count int64
	if err := db.Model(&MasterUnit{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check existing units: %w", err)
	}

	// If units already exist, skip seeding
	if count > 0 {
		log.Printf("Found %d existing units, skipping unit seeding", count)
		return nil
	}

	log.Println("No existing units found, creating seed units...")

	// Define unit seed data
	units := []MasterUnit{
		{
			NomorPolisi:    "B-1234-ABC",
			NamaKendaraan:  "Truk Engkel 1",
			JenisKendaraan: "TRUK_ENGKEL",
			KapasitasMax:   8000.00,
			IsActive:       true,
		},
		{
			NomorPolisi:    "B-5678-DEF",
			NamaKendaraan:  "Truk Engkel 2",
			JenisKendaraan: "TRUK_ENGKEL",
			KapasitasMax:   7500.00,
			IsActive:       true,
		},
		{
			NomorPolisi:    "B-9012-GHI",
			NamaKendaraan:  "Truk Gandeng 1",
			JenisKendaraan: "TRUK_GANDENG",
			KapasitasMax:   15000.00,
			IsActive:       true,
		},
		{
			NomorPolisi:    "B-3456-JKL",
			NamaKendaraan:  "Truk Gandeng 2",
			JenisKendaraan: "TRUK_GANDENG",
			KapasitasMax:   14000.00,
			IsActive:       true,
		},
		{
			NomorPolisi:    "B-7890-MNO",
			NamaKendaraan:  "Tronton 1",
			JenisKendaraan: "TRONTON",
			KapasitasMax:   18000.00,
			IsActive:       true,
		},
		{
			NomorPolisi:    "B-2345-PQR",
			NamaKendaraan:  "Tronton 2",
			JenisKendaraan: "TRONTON",
			KapasitasMax:   17500.00,
			IsActive:       true,
		},
		{
			NomorPolisi:    "B-6789-STU",
			NamaKendaraan:  "Dump Truck 1",
			JenisKendaraan: "DUMP_TRUCK",
			KapasitasMax:   25000.00,
			IsActive:       true,
		},
		{
			NomorPolisi:    "B-0123-VWX",
			NamaKendaraan:  "Dump Truck 2",
			JenisKendaraan: "DUMP_TRUCK",
			KapasitasMax:   24000.00,
			IsActive:       true,
		},
	}

	// Create units
	for _, unit := range units {
		if err := db.Create(&unit).Error; err != nil {
			return fmt.Errorf("failed to create unit %s: %w", unit.NomorPolisi, err)
		}
		log.Printf("Created unit: %s - %s (%.0f kg)", unit.NomorPolisi, unit.NamaKendaraan, unit.KapasitasMax)
	}

	log.Printf("Successfully created %d seed units", len(units))
	return nil
}
