package bootstrap

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/config"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/models"
	"gorm.io/gorm"
)

// CoreApplication represents essential services needed for authentication
type CoreApplication struct {
	Container *CoreContainer
	config    *Config
	appConfig *config.AppConfig
}

// NewCoreApplication creates a new core application instance
func NewCoreApplication(config *Config) *CoreApplication {
	return &CoreApplication{
		config: config,
	}
}

// InitializeCore initializes only essential services needed for authentication
func (app *CoreApplication) InitializeCore(ctx context.Context) error {
	// Load full application configuration
	configPath := config.GetConfigPath()
	appConfig, err := config.LoadConfig(configPath)
	if err != nil {
		return fmt.Errorf("failed to load application config: %w", err)
	}
	app.appConfig = appConfig

	// Force canonical runtime database path from bootstrap config to prevent split DB usage.
	app.appConfig.DatabasePath = app.config.DatabasePath

	// Initialize database
	db, err := app.initDatabase()
	if err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}

	// Create core dependency container with minimal services
	app.Container = NewCoreContainer(db, app.config.DeviceID, appConfig, ctx)

	// Run only essential migrations (auth-related tables)
	if err := app.runCoreMigrations(db); err != nil {
		return fmt.Errorf("failed to run core migrations: %w", err)
	}

	// Fix any existing lowercase role values
	if err := app.fixUserRoles(db); err != nil {
		log.Printf("Warning: Failed to fix user roles: %v", err)
		// Don't return error - allow app to continue
	}

	// Create default users
	if err := app.createDefaultUsers(db); err != nil {
		return fmt.Errorf("failed to create default users: %w", err)
	}

	log.Printf("Core application initialized successfully with device ID: %s", app.config.DeviceID)
	return nil
}

// InitializeForRole initializes the full application with role-based services
func (app *CoreApplication) InitializeForRole(ctx context.Context, userRole string) error {
	// This method will be called when upgrading from core to full application
	// The full initialization will be handled by the main Application struct
	log.Printf("Core application initializing for role: %s", userRole)
	return nil
}

// GetConfig returns the core application configuration
func (app *CoreApplication) GetConfig() *Config {
	return app.config
}

// GetAppConfig returns the full application configuration
func (app *CoreApplication) GetAppConfig() *config.AppConfig {
	return app.appConfig
}

// Shutdown gracefully shuts down the core application
func (app *CoreApplication) Shutdown(ctx context.Context) error {
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

	log.Println("Core application shutdown completed")
	return nil
}

// initDatabase initializes the database connection
func (app *CoreApplication) initDatabase() (*gorm.DB, error) {
	// Use CGO-free SQLite connection with enhanced error handling
	db, err := database.NewCGOFreeConnection(app.config.DatabasePath)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Set the global DB instance for compatibility
	database.DB = db

	return db, nil
}

// runCoreMigrations runs only essential database migrations for authentication
func (app *CoreApplication) runCoreMigrations(db *gorm.DB) error {
	log.Println("Starting core database migrations...")

	// Auto migrate only essential models for authentication
	migrations := []interface{}{
		&models.UserModel{},       // User authentication
		&models.DeviceInfoModel{}, // Device identification
		&models.AuditLogModel{},   // Basic audit logging
	}

	// Run migrations with error handling
	err := db.AutoMigrate(migrations...)
	if err != nil {
		return fmt.Errorf("failed to run core database migrations: %w", err)
	}

	log.Printf("Successfully migrated %d core model types", len(migrations))
	log.Println("Core database migrations completed successfully")
	return nil
}

// fixUserRoles normalizes any lowercase role values to uppercase
func (app *CoreApplication) fixUserRoles(db *gorm.DB) error {
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
func (app *CoreApplication) createDefaultUsers(db *gorm.DB) error {
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
