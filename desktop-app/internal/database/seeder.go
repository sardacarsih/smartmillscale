package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// Seeder interface defines the contract for all seeders
type Seeder interface {
	// Name returns the name of the seeder
	Name() string

	// Dependencies returns the list of seeder names that must run before this one
	Dependencies() []string

	// Run executes the seeder logic
	Run(db *gorm.DB) error
}

// RunAllSeeders executes all registered seeders in the correct order
func RunAllSeeders(db *gorm.DB) error {
	log.Println("Starting master data seeding...")

	// Register all seeders in dependency order
	seeders := []Seeder{
		// Users must come first (no dependencies)
		&UserSeeder{},

		// PKS master data seeders (no dependencies between them)
		&ProdukSeeder{},
		&UnitSeeder{},
		&SupplierSeeder{},
		&CustomerSeeder{},

		// Estate hierarchy (has dependencies: estate -> afdeling -> blok)
		&EstateSeeder{},
		&AfdelingSeeder{},
		&BlokSeeder{},
	}

	// Execute seeders in order
	for _, seeder := range seeders {
		if err := runSeeder(db, seeder); err != nil {
			return fmt.Errorf("failed to run seeder %s: %w", seeder.Name(), err)
		}
	}

	log.Println("Master data seeding completed successfully")
	return nil
}

// runSeeder executes a single seeder within a transaction
func runSeeder(db *gorm.DB, seeder Seeder) error {
	log.Printf("Running seeder: %s", seeder.Name())

	// Run seeder in a transaction for safety
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := seeder.Run(tx); err != nil {
			return fmt.Errorf("seeder execution failed: %w", err)
		}
		return nil
	})

	if err != nil {
		log.Printf("✗ Seeder %s failed: %v", seeder.Name(), err)
		return err
	}

	log.Printf("✓ Seeder %s completed successfully", seeder.Name())
	return nil
}
