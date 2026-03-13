package bootstrap

import (
	"context"
	"gorm.io/gorm"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/config"
)

// CoreContainer holds only essential dependencies for authentication
type CoreContainer struct {
	// Database
	DB *gorm.DB

	// Configuration
	AppConfig *config.AppConfig

	// Core Services
	AuthService *auth.AuthService

	// Core Controllers (for auth operations only)
	CoreController *CoreController
}

// NewCoreContainer creates a new core dependency container with minimal services
func NewCoreContainer(db *gorm.DB, deviceID string, appConfig *config.AppConfig, ctx context.Context) *CoreContainer {
	container := &CoreContainer{
		DB:        db,
		AppConfig: appConfig,
	}

	// Initialize only core repositories
	container.initCoreRepositories()

	// Initialize only core services
	container.initCoreServices()

	// Initialize core controllers
	container.initCoreControllers(ctx)

	return container
}

// initCoreRepositories initializes only essential repositories for authentication
func (c *CoreContainer) initCoreRepositories() {
	// Only initialize repositories needed for authentication
	// UserRepository is essential for login/logout operations
	// Other repositories will be initialized in the full container after authentication
	// No repositories to initialize here since auth.NewAuthService creates its own repository
}

// initCoreServices initializes only essential services for authentication
func (c *CoreContainer) initCoreServices() {
	// Only initialize authentication service
	c.AuthService = auth.NewAuthService(c.DB)
}

// initCoreControllers initializes only essential controllers for authentication
func (c *CoreContainer) initCoreControllers(ctx context.Context) {
	c.CoreController = NewCoreController(c.AuthService, c.DB)
}

// CoreController handles only authentication-related operations
type CoreController struct {
	authService *auth.AuthService
	db          *gorm.DB
}

// NewCoreController creates a new core controller for authentication
func NewCoreController(authService *auth.AuthService, db *gorm.DB) *CoreController {
	return &CoreController{
		authService: authService,
		db:          db,
	}
}

// GetAuthService returns the authentication service
func (c *CoreController) GetAuthService() *auth.AuthService {
	return c.authService
}

// GetDatabase returns the database connection
func (c *CoreController) GetDatabase() *gorm.DB {
	return c.db
}