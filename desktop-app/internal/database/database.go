package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"

	"gorm.io/gorm"
)

// DB is the global database instance
var DB *gorm.DB

// InitDatabase initializes the SQLite database with migrations
func InitDatabase(dbPath string) error {
	// Ensure database directory exists
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	// Use CGO-free connection
	db, err := NewCGOFreeConnection(dbPath)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Run migrations
	if err := runMigrations(db); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Create indexes
	if err := createIndexes(db); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	// Run master data seeding using new seed system
	if err := runSeedSystem(db); err != nil {
		log.Printf("Warning: Failed to run seed system: %v", err)
		// Don't return error - allow app to continue even if seeding fails
	}

	DB = db
	log.Println("Database initialized successfully")
	return nil
}

// runMigrations runs all database migrations
func runMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Auto-migrate all models
	err := db.AutoMigrate(
		// Auth models
		&auth.User{},
		&auth.AuditLog{},
		&auth.APIKey{},

		// Business models
		&Timbangan{},
		&SyncQueue{},
		&SyncHistory{},
		&DeviceInfo{},
		&VehicleTemplate{},
		&WeighingSession{},
		&WeightValidationRule{},

		// PKS (Palm Oil Mill System) models
		&MasterProduk{},
		&MasterUnit{},
		&MasterSupplier{},
		&MasterCustomer{},
		&MasterEstate{},
		&MasterAfdeling{},
		&MasterBlok{},
		&TimbanganPKS{},
		&TimbanganPKSTBSBlockDetail{},

		&PKSTicket{},

		// Weight monitoring table
		&WeightHistoryEntry{},
	)
	if err != nil {
		return err
	}

	log.Println("Database migrations completed successfully")

	// Drop legacy tables that have been replaced by Master* versions
	legacyTables := []string{"produk", "unit", "estate", "afdeling", "blok"}
	for _, table := range legacyTables {
		if db.Migrator().HasTable(table) {
			if err := db.Migrator().DropTable(table); err != nil {
				log.Printf("Warning: failed to drop legacy table %s: %v", table, err)
			} else {
				log.Printf("Dropped legacy table: %s", table)
			}
		}
	}

	return nil
}

// createIndexes creates additional indexes not handled by GORM tags
func createIndexes(db *gorm.DB) error {
	log.Println("Creating database indexes...")

	// Auth table indexes
	// Create index for audit log queries
	err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action
		ON audit_logs(user_id, action, timestamp DESC)
	`).Error
	if err != nil {
		return fmt.Errorf("failed to create audit log index: %w", err)
	}

	// Create index for audit log timestamp queries
	err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
		ON audit_logs(timestamp DESC)
	`).Error
	if err != nil {
		return fmt.Errorf("failed to create audit log timestamp index: %w", err)
	}

	// API Keys table indexes
	// Create index for API key active status and server URL
	err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_api_keys_active_url
		ON api_keys(is_active, server_url)
	`).Error
	if err != nil {
		return fmt.Errorf("failed to create api keys active url index: %w", err)
	}

	// Create index for API key name searches
	err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_api_keys_name
		ON api_keys(name)
	`).Error
	if err != nil {
		return fmt.Errorf("failed to create api keys name index: %w", err)
	}

	// Business table indexes
	// Create composite unique index for duplicate prevention
	// Index on (device_id, tanggal, nomor_kendaraan, berat_kotor)
	// This is already handled by GORM tags in the model

	// Create index for sync status queries
	err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_timbangan_sync_pending
		ON timbangan(status_sync, updated_at)
		WHERE status_sync IN ('PENDING', 'FAILED')
	`).Error
	if err != nil {
		return fmt.Errorf("failed to create sync pending index: %w", err)
	}

	// Create index for vehicle number searches
	err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_timbangan_vehicle_date
		ON timbangan(nomor_kendaraan, tanggal DESC)
	`).Error
	if err != nil {
		return fmt.Errorf("failed to create vehicle date index: %w", err)
	}

	// PKS (Palm Oil Mill System) indexes
	// Master data indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_master_produk_active ON master_produk(is_active)").Error; err != nil {
		return fmt.Errorf("failed to create master produk active index: %w", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_master_unit_active ON master_unit(is_active)").Error; err != nil {
		return fmt.Errorf("failed to create master unit active index: %w", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_master_unit_polisi ON master_unit(nomor_polisi)").Error; err != nil {
		return fmt.Errorf("failed to create master unit polisi index: %w", err)
	}

	// PKS Transaction indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_timbangan_pks_status ON timbangan_pks(status)").Error; err != nil {
		return fmt.Errorf("failed to create timbangan pks status index: %w", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_timbangan_pks_date ON timbangan_pks(timbang1_date)").Error; err != nil {
		return fmt.Errorf("failed to create timbangan pks date index: %w", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_timbangan_pks_unit ON timbangan_pks(id_unit)").Error; err != nil {
		return fmt.Errorf("failed to create timbangan pks unit index: %w", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_timbangan_pks_produk ON timbangan_pks(id_produk)").Error; err != nil {
		return fmt.Errorf("failed to create timbangan pks produk index: %w", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_timbangan_pks_sync ON timbangan_pks(is_synced, id_sync)").Error; err != nil {
		return fmt.Errorf("failed to create timbangan pks sync index: %w", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_timbangan_pks_tbs_detail_tx ON timbangan_pks_tbs_block_details(timbangan_pks_id)").Error; err != nil {
		return fmt.Errorf("failed to create timbangan pks tbs detail tx index: %w", err)
	}

	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_timbangan_pks_tbs_detail_refs ON timbangan_pks_tbs_block_details(id_blok, id_afdeling, id_estate)").Error; err != nil {
		return fmt.Errorf("failed to create timbangan pks tbs detail refs index: %w", err)
	}

	log.Println("Database indexes created successfully")
	return nil
}

// CloseDatabase closes the database connection
func CloseDatabase() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

// VacuumDatabase optimizes the SQLite database
func VacuumDatabase() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	log.Println("Running VACUUM on database...")
	if err := DB.Exec("VACUUM").Error; err != nil {
		return fmt.Errorf("failed to vacuum database: %w", err)
	}

	if err := DB.Exec("ANALYZE").Error; err != nil {
		return fmt.Errorf("failed to analyze database: %w", err)
	}

	log.Println("Database optimization completed")
	return nil
}

// runSeedSystem executes the new master data seeding system
func runSeedSystem(db *gorm.DB) error {
	log.Println("Running master data seed system...")
	if err := RunAllSeeders(db); err != nil {
		return fmt.Errorf("seed system failed: %w", err)
	}
	log.Println("Master data seed system completed successfully")
	return nil
}

// GetDB returns the global database instance
func GetDB() *gorm.DB {
	return DB
}
