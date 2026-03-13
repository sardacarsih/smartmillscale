package bootstrap

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/config"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/models"
	appservice "github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
	"gorm.io/gorm"
)

// Application represents the main application
type Application struct {
	Container *Container
	config    *Config
	appConfig *config.AppConfig
}

// Config represents application configuration
type Config struct {
	DatabasePath string
	DeviceID     string
	DebugMode    bool
	ServerURL    string
	APIKey       string
}

// NewApplication creates a new application instance
func NewApplication(config *Config) *Application {
	return &Application{
		config: config,
	}
}

// Initialize initializes the application
func (app *Application) Initialize() error {
	// Use background context for backward compatibility
	ctx := context.Background()
	return app.InitializeWithContext(ctx)
}

// InitializeWithContext initializes the application with a specific context
func (app *Application) InitializeWithContext(ctx context.Context) error {
	return app.InitializeForRole(ctx, "")
}

// InitializeForRole initializes the application with role-based service loading
func (app *Application) InitializeForRole(ctx context.Context, userRole string) error {
	// Load full application configuration
	configPath := config.GetConfigPath()
	appConfig, err := config.LoadConfig(configPath)
	if err != nil {
		return fmt.Errorf("failed to load application config: %w", err)
	}
	app.appConfig = appConfig

	// Force canonical runtime database path from bootstrap config to prevent split DB usage.
	app.appConfig.DatabasePath = app.config.DatabasePath

	// Initialize database if not already initialized
	var db *gorm.DB
	if app.Container == nil || app.Container.DB == nil {
		db, err = app.initDatabase()
		if err != nil {
			return fmt.Errorf("failed to initialize database: %w", err)
		}
	} else {
		db = app.Container.DB
	}

	settingsSvc := appservice.NewSystemSettingsService(configPath)
	persistedSettings, err := settingsSvc.GetOrInitSettings(db)
	if err != nil {
		return fmt.Errorf("failed to load persisted system settings: %w", err)
	}
	applyPersistedSettingsToAppConfig(appConfig, persistedSettings)

	// Create dependency container with full configuration and Wails context
	app.Container = NewContainerWithConfigAndRole(db, app.config.DeviceID, appConfig, ctx, userRole)

	// Apply sync runtime settings (minutes -> seconds) to SyncUseCase config.
	applyPersistedSyncConfig(app.Container, persistedSettings)

	// Run migrations (skip if already run by core application)
	if err := app.runMigrations(db); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Run master data seeding using new seed system (only for authenticated session)
	if err := database.InitDatabase(app.config.DatabasePath); err != nil {
		log.Printf("Warning: Failed to run seed system: %v", err)
		// Don't return error - allow app to continue even if seeding fails
	}

	log.Printf("Application initialized successfully for role: %s, device ID: %s", userRole, app.config.DeviceID)
	return nil
}

func applyPersistedSettingsToAppConfig(appConfig *config.AppConfig, persisted *appservice.SystemSettingsPayload) {
	if appConfig == nil || persisted == nil {
		return
	}

	appConfig.Company = persisted.Company
	appConfig.Weighing.COMPort = persisted.Serial.Port
	appConfig.Weighing.BaudRate = persisted.Serial.BaudRate
	appConfig.Weighing.DataBits = persisted.Serial.DataBits
	appConfig.Weighing.StopBits = persisted.Serial.StopBits
	appConfig.Weighing.Parity = mapParityUIToConfig(persisted.Serial.Parity)
	appConfig.Weighing.ReadTimeout = persisted.Serial.Timeout
	if appConfig.Weighing.WriteTimeout <= 0 {
		appConfig.Weighing.WriteTimeout = persisted.Serial.Timeout
	}

	if persisted.System.SyncInterval > 0 {
		appConfig.Sync.SyncInterval = time.Duration(persisted.System.SyncInterval) * time.Minute
	}
}

func applyPersistedSyncConfig(container *Container, persisted *appservice.SystemSettingsPayload) {
	if container == nil || container.SyncUseCase == nil || persisted == nil {
		return
	}

	current := container.SyncUseCase.GetSyncConfig()
	next := &dto.SyncConfig{}
	if current != nil {
		*next = *current
	}

	next.AutoSyncEnabled = persisted.System.SyncEnabled
	next.SyncInterval = persisted.System.SyncInterval * 60
	if next.SyncInterval <= 0 {
		next.SyncInterval = 300
	}
	if next.MaxRetries <= 0 {
		next.MaxRetries = 3
	}
	if next.RetryDelay <= 0 {
		next.RetryDelay = 60
	}
	if next.BatchSize <= 0 {
		next.BatchSize = 50
	}
	if next.Timeout <= 0 {
		next.Timeout = 30
	}

	container.SyncUseCase.UpdateSyncConfig(next)
}

func mapParityUIToConfig(parity string) string {
	switch parity {
	case "even":
		return "E"
	case "odd":
		return "O"
	case "mark":
		return "M"
	case "space":
		return "S"
	default:
		return "N"
	}
}

// initDatabase initializes the database connection
func (app *Application) initDatabase() (*gorm.DB, error) {
	// Use CGO-free SQLite connection with enhanced error handling
	db, err := database.NewCGOFreeConnection(app.config.DatabasePath)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Set the global DB instance for compatibility
	database.DB = db

	// Note: Migrations will be run in the Initialize() method after container creation
	// to avoid duplicate migration calls

	return db, nil
}

// runMigrations runs database migrations with enhanced error handling
func (app *Application) runMigrations(db *gorm.DB) error {
	log.Println("Starting database migrations...")

	// Auto migrate all models with retry mechanism for SQLite locks
	migrations := []interface{}{
		&models.TimbanganModel{},
		&models.UserModel{},
		&models.SyncQueueModel{},
		&models.SyncHistoryModel{},
		&models.DeviceInfoModel{},
		&models.WeighingSessionModel{},
		&models.AuditLogModel{},
		&models.SystemSettingsModel{},

		// PKS Master Data Tables
		&database.MasterProduk{},
		&database.MasterUnit{},
		&database.MasterSupplier{},
		&database.MasterCustomer{},
		&database.MasterEstate{},
		&database.MasterAfdeling{},
		&database.MasterBlok{},
		&database.TimbanganPKS{},
		&database.PKSTicket{},
	}

	// Run migrations with error handling
	err := db.AutoMigrate(migrations...)
	if err != nil {
		return fmt.Errorf("failed to run database migrations: %w", err)
	}

	log.Printf("Successfully migrated %d model types", len(migrations))
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

// createIndexes creates additional database indexes
func (app *Application) createIndexes(db *gorm.DB) error {
	// Create composite indexes for better query performance
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_timbangan_composite ON timbangan(device_id, tanggal, created_at)",
		"CREATE INDEX IF NOT EXISTS idx_timbangan_sync ON timbangan(status_sync, created_at)",
		"CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active, role)",
		"CREATE INDEX IF NOT EXISTS idx_audit_composite ON audit_logs(action, timestamp)",
		"CREATE INDEX IF NOT EXISTS idx_sync_queue_composite ON sync_queue(status, created_at)",
	}

	for _, indexSQL := range indexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			return fmt.Errorf("failed to create index: %s, error: %w", indexSQL, err)
		}
	}

	return nil
}

// Shutdown gracefully shuts down the application
func (app *Application) Shutdown(ctx context.Context) error {
	if app.Container != nil && app.Container.DB != nil {
		sqlDB, err := app.Container.DB.DB()
		if err != nil {
			log.Printf("Warning: failed to get underlying sql.DB: %v", err)
		} else {
			if err := sqlDB.Close(); err != nil {
				log.Printf("Warning: failed to close database connection: %v", err)
			}
		}
	}

	log.Println("Application shutdown completed")
	return nil
}

// GetConfig returns the application configuration
func (app *Application) GetConfig() *Config {
	return app.config
}

// HealthCheck performs a basic health check
func (app *Application) HealthCheck() error {
	if app.Container == nil || app.Container.DB == nil {
		return fmt.Errorf("application not properly initialized")
	}

	// Test database connection
	sqlDB, err := app.Container.DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("database connection failed: %w", err)
	}

	return nil
}

// fixUserRoles normalizes any lowercase role values to uppercase
func (app *Application) fixUserRoles(db *gorm.DB) error {
	log.Println("Fixing user role values...")

	// Define role mappings from lowercase to uppercase
	roleMappings := map[string]auth.UserRole{
		"admin":      auth.RoleAdmin,
		"supervisor": auth.RoleSupervisor,
		"timbangan":  auth.RoleTimbangan,
		"grading":    auth.RoleGrading,
		"ADMIN":      auth.RoleAdmin, // Already correct, but include for completeness
		"SUPERVISOR": auth.RoleSupervisor,
		"TIMBANGAN":  auth.RoleTimbangan,
		"GRADING":    auth.RoleGrading,
	}

	// Get all users
	var users []auth.User
	if err := db.Find(&users).Error; err != nil {
		return fmt.Errorf("failed to fetch users: %w", err)
	}

	// Track how many were fixed
	fixed := 0

	// Update roles that need fixing
	for _, user := range users {
		currentRole := string(user.Role)
		if correctRole, exists := roleMappings[currentRole]; exists {
			// If the role doesn't match the correct uppercase version, fix it
			if string(user.Role) != string(correctRole) {
				log.Printf("Fixing role for user %s: %s -> %s", user.Username, user.Role, correctRole)
				user.Role = correctRole
				if err := db.Save(&user).Error; err != nil {
					log.Printf("Warning: Failed to fix role for user %s: %v", user.Username, err)
				} else {
					fixed++
				}
			}
		}
	}

	if fixed > 0 {
		log.Printf("Fixed %d user role values", fixed)
	} else {
		log.Println("All user roles are correctly formatted")
	}

	return nil
}

// createDefaultUsers creates default users for each role
func (app *Application) createDefaultUsers(db *gorm.DB) error {
	log.Println("Creating default users...")

	// Define default users with easy to remember credentials
	defaultUsers := []struct {
		username string
		password string
		role     auth.UserRole
		fullName string
	}{
		{"admin", "admin123", auth.RoleAdmin, "Administrator"},
		{"supervisor", "supervisor123", auth.RoleSupervisor, "Supervisor"},
		{"operator", "operator123", auth.RoleTimbangan, "Operator Timbang"},
		{"grading", "grading123", auth.RoleGrading, "Grading Staff"},
	}

	for _, user := range defaultUsers {
		// Check if user already exists
		var existingUser auth.User
		err := db.Where("username = ?", user.username).First(&existingUser).Error
		if err == nil {
			// User exists, reset password to ensure it matches expected default
			log.Printf("User %s already exists, resetting password to default", user.username)
			if err := existingUser.SetPassword(user.password); err != nil {
				return fmt.Errorf("failed to reset password for user %s: %w", user.username, err)
			}
			if err := db.Save(&existingUser).Error; err != nil {
				return fmt.Errorf("failed to update password for user %s: %w", user.username, err)
			}
			log.Printf("Reset password for existing user: %s (role: %s)", user.username, user.role)
			continue
		}

		// Create new user with explicit UUID generation
		newUser := auth.User{
			ID:       uuid.New(), // Explicitly generate UUID
			Username: user.username,
			FullName: user.fullName,
			Role:     user.role,
			IsActive: true,
		}

		// Hash password
		if err := newUser.SetPassword(user.password); err != nil {
			return fmt.Errorf("failed to hash password for user %s: %w", user.username, err)
		}

		// Save user to database
		if err := db.Create(&newUser).Error; err != nil {
			return fmt.Errorf("failed to create user %s: %w", user.username, err)
		}

		log.Printf("Created default user: %s (role: %s)", user.username, user.role)
	}

	log.Println("Default users creation completed")
	return nil
}
