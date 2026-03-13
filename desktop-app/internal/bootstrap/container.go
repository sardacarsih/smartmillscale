package bootstrap

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/usecases"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/config"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/presentation/controllers"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/serial"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/sync"
	"gorm.io/gorm"
)

// Container holds all application dependencies
type Container struct {
	// Database
	DB *gorm.DB

	// Configuration
	AppConfig *config.AppConfig

	// Repositories
	TimbanganRepository repositories.TimbanganRepository
	UserRepository      repositories.UserRepository
	SyncQueueRepository repositories.SyncQueueRepository
	APIKeyRepository    repositories.APIKeyRepository
	// TODO: Implement missing repositories when needed
	// DeviceRepository   repositories.DeviceRepository
	// WeighingSessionRepository repositories.WeighingSessionRepository
	// AuditRepository    repositories.AuditRepository

	// Services
	AuthService *auth.AuthService

	// Use Cases
	WeighingUseCase       *usecases.WeighingUseCase
	UserManagementUseCase *usecases.UserManagementUseCase
	SyncUseCase           *usecases.SyncUseCase
	MasterDataSyncUseCase *usecases.MasterDataSyncUseCase
	APIKeyUseCase         *usecases.APIKeyUseCase

	// PKS Services
	PKSService              *service.PKSService
	PKSMasterService        *service.PKSMasterService
	PKSReportService        *service.PKSReportService
	ExcelExportService      *service.ExcelExportService
	WeightMonitoringService *service.WeightMonitoringService
	TicketService           *service.TicketService

	// Controllers
	WeighingController         *controllers.WeighingController
	UserController             *controllers.UserController
	SyncController             *controllers.SyncController
	APIKeyController           *controllers.APIKeyController
	PKSController              *controllers.PKSController
	PKSMasterController        *controllers.PKSMasterController
	PKSReportController        *controllers.PKSReportController
	WeightMonitoringController *controllers.WeightMonitoringController
	TicketController           *controllers.TicketController
}

// NewContainer creates a new dependency container
func NewContainer(db *gorm.DB, deviceID string, ctx context.Context) *Container {
	container := &Container{
		DB: db,
	}

	// Initialize repositories
	container.initRepositories()

	// Initialize services
	container.initServices()

	// Initialize use cases
	container.initUseCases(deviceID)

	// Initialize PKS services
	container.initPKSServices(deviceID, ctx)

	// Initialize controllers
	container.initControllers()

	// Initialize API Key components
	container.initAPIKeyComponents()

	return container
}

// NewContainerWithConfig creates a new dependency container with configuration
func NewContainerWithConfig(db *gorm.DB, deviceID string, appConfig *config.AppConfig, ctx context.Context) *Container {
	return NewContainerWithConfigAndRole(db, deviceID, appConfig, ctx, "")
}

// NewContainerWithConfigAndRole creates a new dependency container with configuration and role-based initialization
func NewContainerWithConfigAndRole(db *gorm.DB, deviceID string, appConfig *config.AppConfig, ctx context.Context, userRole string) *Container {
	container := &Container{
		DB:        db,
		AppConfig: appConfig,
	}

	// Initialize repositories
	container.initRepositories()

	// Initialize services
	container.initServices()

	// Initialize use cases based on user role
	container.initUseCasesForRole(deviceID, userRole)

	// Initialize PKS services with configuration based on role
	container.initPKSServicesWithConfigAndRole(deviceID, ctx, userRole)

	// Initialize controllers with context based on role
	container.initControllersWithContextAndRole(ctx, userRole)

	// Initialize API Key components
	container.initAPIKeyComponents()

	return container
}

// initRepositories initializes all repository implementations
func (c *Container) initRepositories() {
	c.TimbanganRepository = persistence.NewTimbanganRepository(c.DB)
	c.UserRepository = persistence.NewUserRepository(c.DB)
	c.SyncQueueRepository = persistence.NewSyncQueueRepository(c.DB)
	// TODO: Implement missing repositories when needed
	// c.DeviceRepository = persistence.NewDeviceRepository(c.DB)
	// c.WeighingSessionRepository = persistence.NewWeighingSessionRepository(c.DB)
	// c.AuditRepository = persistence.NewAuditRepository(c.DB)
}

// initServices initializes all service implementations
func (c *Container) initServices() {
	c.AuthService = auth.NewAuthService(c.DB)
}

// initUseCases initializes all use case implementations
func (c *Container) initUseCases(deviceID string) {
	c.WeighingUseCase = usecases.NewWeighingUseCase(
		c.TimbanganRepository,
		nil, // DeviceRepository - TODO: implement
		nil, // WeighingSessionRepository - TODO: implement
		deviceID,
	)

	c.UserManagementUseCase = usecases.NewUserManagementUseCase(
		c.UserRepository,
		nil, // AuditRepository - TODO: implement
	)

	if c.APIKeyRepository == nil {
		c.APIKeyRepository = persistence.NewAPIKeyRepository(c.DB)
	}

	// Parse deviceID to UUID for sync client factory
	deviceUUID, err := uuid.Parse(deviceID)
	if err != nil {
		log.Printf("Warning: Invalid device ID format, using nil UUID for sync: %v", err)
		deviceUUID = uuid.Nil
	}

	// Create sync client factory for API key-based GraphQL client creation
	clientFactory := sync.NewClientFactory(c.APIKeyRepository, deviceUUID)

	c.SyncUseCase = usecases.NewSyncUseCase(
		c.TimbanganRepository,
		c.SyncQueueRepository,
		// SyncHistoryRepository would need to be implemented
		nil,
		nil, // DeviceRepository - TODO: implement
		clientFactory,
	)

	c.MasterDataSyncUseCase = usecases.NewMasterDataSyncUseCase(c.DB, clientFactory)
}

// initPKSServices initializes all PKS service implementations
func (c *Container) initPKSServices(deviceID string, ctx context.Context) {
	c.PKSService = service.NewPKSService(c.DB, deviceID)
	c.PKSMasterService = service.NewPKSMasterService(c.DB)
	c.PKSReportService = service.NewPKSReportService(c.DB, deviceID)
	c.ExcelExportService = service.NewExcelExportService()
	c.WeightMonitoringService = service.NewWeightMonitoringService(c.DB, ctx)
	c.TicketService = service.NewTicketService(c.DB)
	if c.AppConfig != nil {
		c.TicketService.SetCompanyConfig(&c.AppConfig.Company)
	}
}

// initPKSServicesWithConfig initializes all PKS services with configuration
func (c *Container) initPKSServicesWithConfig(deviceID string, ctx context.Context) {
	c.PKSService = service.NewPKSService(c.DB, deviceID)
	c.PKSMasterService = service.NewPKSMasterService(c.DB)
	c.PKSReportService = service.NewPKSReportService(c.DB, deviceID)
	c.ExcelExportService = service.NewExcelExportService()
	c.WeightMonitoringService = service.NewWeightMonitoringService(c.DB, ctx)
	c.TicketService = service.NewTicketService(c.DB)
	if c.AppConfig != nil {
		c.TicketService.SetCompanyConfig(&c.AppConfig.Company)
	}

	// Create and configure serial reader based on configuration
	if c.AppConfig != nil {
		weighingConfig := c.AppConfig.Weighing

		// Validate serial configuration
		if err := serial.ValidateSerialConfig(weighingConfig); err != nil {
			if weighingConfig.MockSerialEnabled {
				log.Printf("Warning: Invalid serial configuration for mock mode: %v", err)
				log.Printf("Proceeding with mock mode despite validation error...")
			} else {
				log.Printf("ERROR: Serial device connection failed - Invalid configuration: %v", err)
				log.Printf("ERROR: Please check your .env file settings (SERIAL_COM_PORT, SERIAL_BAUD_RATE, etc.)")
				log.Printf("Weight monitoring service will run without serial device connection.")
				return
			}
		}

		// Create serial reader using factory
		serialReader, err := serial.CreateSerialReader(weighingConfig)
		if err != nil {
			if weighingConfig.MockSerialEnabled {
				log.Printf("Warning: Failed to create mock serial reader: %v", err)
			} else {
				log.Printf("ERROR: Serial device connection failed - Cannot create connection to %s: %v", weighingConfig.COMPort, err)
				log.Printf("ERROR: Please verify:")
				log.Printf("  1. Device is connected to port %s", weighingConfig.COMPort)
				log.Printf("  2. Port is not in use by another application")
				log.Printf("  3. You have proper permissions to access the serial port")
				log.Printf("Weight monitoring service will run without serial device connection.")
			}
			return
		}

		// Configure WeightMonitoringService with serial reader
		if serialReader != nil {
			c.WeightMonitoringService.SetSerialReader(serialReader)

			// Start the serial reader
			if err := serialReader.Start(); err != nil {
				if weighingConfig.MockSerialEnabled {
					log.Printf("Warning: Failed to start mock serial reader: %v", err)
				} else {
					log.Printf("ERROR: Serial device connection failed - Cannot start device on %s: %v", weighingConfig.COMPort, err)
					log.Printf("Weight monitoring service will run without serial device connection.")
				}
			} else {
				mode := "real device"
				if serial.IsMockMode(weighingConfig) {
					mode = "mock"
				}
				log.Printf("Serial reader started successfully in %s mode on %s", mode, weighingConfig.COMPort)
			}
		}
	}
}

// initControllers initializes all controller implementations
func (c *Container) initControllers() {
	c.WeighingController = controllers.NewWeighingController(c.WeighingUseCase)
	c.UserController = controllers.NewUserController(c.AuthService)
	c.SyncController = controllers.NewSyncController(c.SyncUseCase)
	c.PKSController = controllers.NewPKSController(c.PKSService)
	c.PKSMasterController = controllers.NewPKSMasterController(c.PKSMasterService, c.MasterDataSyncUseCase)
	c.PKSReportController = controllers.NewPKSReportController(c.PKSReportService, c.ExcelExportService)
	c.WeightMonitoringController = controllers.NewWeightMonitoringController(c.WeightMonitoringService)
	c.TicketController = controllers.NewTicketController(c.TicketService)
}

// initUseCasesForRole initializes use case implementations based on user role
func (c *Container) initUseCasesForRole(deviceID string, userRole string) {
	// User management is available for all authenticated users
	c.UserManagementUseCase = usecases.NewUserManagementUseCase(
		c.UserRepository,
		nil, // AuditRepository - TODO: implement
	)

	if c.APIKeyRepository == nil {
		c.APIKeyRepository = persistence.NewAPIKeyRepository(c.DB)
	}

	// Parse deviceID to UUID for sync client factory
	deviceUUID, err := uuid.Parse(deviceID)
	if err != nil {
		log.Printf("Warning: Invalid device ID format, using nil UUID for sync: %v", err)
		deviceUUID = uuid.Nil
	}

	// Create sync client factory for API key-based GraphQL client creation
	clientFactory := sync.NewClientFactory(c.APIKeyRepository, deviceUUID)

	// Sync use case is available for all authenticated users
	c.SyncUseCase = usecases.NewSyncUseCase(
		c.TimbanganRepository,
		c.SyncQueueRepository,
		// SyncHistoryRepository would need to be implemented
		nil,
		nil, // DeviceRepository - TODO: implement
		clientFactory,
	)

	c.MasterDataSyncUseCase = usecases.NewMasterDataSyncUseCase(c.DB, clientFactory)

	// Weighing use case is only available for roles that need it
	if c.isWeighingRole(userRole) {
		c.WeighingUseCase = usecases.NewWeighingUseCase(
			c.TimbanganRepository,
			nil, // DeviceRepository - TODO: implement
			nil, // WeighingSessionRepository - TODO: implement
			deviceID,
		)
	}
}

// initPKSServicesWithConfigAndRole initializes PKS services based on user role
func (c *Container) initPKSServicesWithConfigAndRole(deviceID string, ctx context.Context, userRole string) {
	// Basic PKS services for all authenticated users
	c.PKSService = service.NewPKSService(c.DB, deviceID)
	c.PKSMasterService = service.NewPKSMasterService(c.DB)
	c.PKSReportService = service.NewPKSReportService(c.DB, deviceID)
	c.ExcelExportService = service.NewExcelExportService()
	c.TicketService = service.NewTicketService(c.DB)
	if c.AppConfig != nil {
		c.TicketService.SetCompanyConfig(&c.AppConfig.Company)
	}

	// Weight monitoring service is only initialized for roles that need it
	// This prevents serial port connection for users who don't need weighing functionality
	if c.isWeighingRole(userRole) {
		c.WeightMonitoringService = service.NewWeightMonitoringService(c.DB, ctx)

		// Create and configure serial reader based on configuration
		if c.AppConfig != nil {
			weighingConfig := c.AppConfig.Weighing

			// Validate serial configuration
			if err := serial.ValidateSerialConfig(weighingConfig); err != nil {
				if weighingConfig.MockSerialEnabled {
					log.Printf("Warning: Invalid serial configuration for mock mode: %v", err)
					log.Printf("Proceeding with mock mode despite validation error...")
				} else {
					log.Printf("ERROR: Serial device connection failed - Invalid configuration: %v", err)
					log.Printf("ERROR: Please check your .env file settings (SERIAL_COM_PORT, SERIAL_BAUD_RATE, etc.)")
					log.Printf("Weight monitoring service will run without serial device connection.")
					return
				}
			}

			// Create serial reader using factory
			serialReader, err := serial.CreateSerialReader(weighingConfig)
			if err != nil {
				if weighingConfig.MockSerialEnabled {
					log.Printf("Warning: Failed to create mock serial reader: %v", err)
				} else {
					log.Printf("ERROR: Serial device connection failed - Cannot create connection to %s: %v", weighingConfig.COMPort, err)
					log.Printf("ERROR: Please verify:")
					log.Printf("  1. Device is connected to port %s", weighingConfig.COMPort)
					log.Printf("  2. Port is not in use by another application")
					log.Printf("  3. You have proper permissions to access the serial port")
					log.Printf("Weight monitoring service will run without serial device connection.")
				}
				return
			}

			// Configure WeightMonitoringService with serial reader
			if serialReader != nil {
				c.WeightMonitoringService.SetSerialReader(serialReader)

				// Start the serial reader
				if err := serialReader.Start(); err != nil {
					if weighingConfig.MockSerialEnabled {
						log.Printf("Warning: Failed to start mock serial reader: %v", err)
					} else {
						log.Printf("ERROR: Serial device connection failed - Cannot start device on %s: %v", weighingConfig.COMPort, err)
						log.Printf("Weight monitoring service will run without serial device connection.")
					}
				} else {
					mode := "real device"
					if serial.IsMockMode(weighingConfig) {
						mode = "mock"
					}
					log.Printf("Serial reader started successfully in %s mode on %s", mode, weighingConfig.COMPort)
				}
			}
		}
	}
}

// initControllersWithContextAndRole initializes controllers based on user role
func (c *Container) initControllersWithContextAndRole(ctx context.Context, userRole string) {
	// Basic controllers available for all authenticated users
	c.UserController = controllers.NewUserController(c.AuthService)
	c.SyncController = controllers.NewSyncController(c.SyncUseCase)
	c.PKSController = controllers.NewPKSController(c.PKSService)
	c.PKSMasterController = controllers.NewPKSMasterController(c.PKSMasterService, c.MasterDataSyncUseCase)
	c.PKSReportController = controllers.NewPKSReportController(c.PKSReportService, c.ExcelExportService)
	c.TicketController = controllers.NewTicketController(c.TicketService)

	// Weighing controller is only available for roles that need it
	if c.isWeighingRole(userRole) {
		c.WeighingController = controllers.NewWeighingController(c.WeighingUseCase)
		c.WeightMonitoringController = controllers.NewWeightMonitoringController(c.WeightMonitoringService)

		// Set Wails context on weight monitoring controller
		if c.WeightMonitoringController != nil {
			c.WeightMonitoringController.SetContext(ctx)
		}
	}
}

// isWeighingRole checks if the user role requires weighing functionality
func (c *Container) isWeighingRole(userRole string) bool {
	// Define which roles need weighing functionality
	weighingRoles := map[string]bool{
		"ADMIN":      true,
		"SUPERVISOR": true,
		"TIMBANGAN":  true,
		// GRADING role typically doesn't need weighing functionality
		"GRADING": false,
		"":        true, // Empty role (backward compatibility) - default to allowing weighing
	}

	return weighingRoles[userRole]
}

// initControllersWithContext initializes all controller implementations with context
func (c *Container) initControllersWithContext(ctx context.Context) {
	c.initControllersWithContextAndRole(ctx, "")
}

// initAPIKeyComponents initializes API key components
func (c *Container) initAPIKeyComponents() {
	c.APIKeyRepository = persistence.NewAPIKeyRepository(c.DB)
	c.APIKeyUseCase = usecases.NewAPIKeyUseCase(c.APIKeyRepository)
	c.APIKeyController = controllers.NewAPIKeyController(c.APIKeyUseCase)
}
