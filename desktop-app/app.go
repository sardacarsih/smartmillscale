package main

//go:generate go run scripts/generate_crud.go

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/bootstrap"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/logger"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/sync"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/wails"
)

// App represents the Wails application
type App struct {
	ctx                    context.Context
	coreApplication        *bootstrap.CoreApplication
	application            *bootstrap.Application
	handler                *wails.WailsHandler
	coreHandler            *wails.WailsCoreHandler
	logger                 logger.Logger
	servicesReady          bool
	weightStreamCtx        context.Context
	weightStreamCancelFunc context.CancelFunc
	mockServer             *sync.MockSyncServer
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// OnStartup is called when the app starts up.
func (a *App) OnStartup(ctx context.Context) {
	a.ctx = ctx

	// Initialize encryption for API keys
	// Use environment variable if set, otherwise fall back to device-specific secret
	encryptionSecret := os.Getenv("SMARTMILL_ENCRYPTION_SECRET")
	if encryptionSecret == "" {
		encryptionSecret = "SmartMillScale-APIKey-2024-Secure-" + getDeviceID()
	}
	if err := auth.InitializeEncryption(encryptionSecret); err != nil {
		wailsruntime.LogError(ctx, fmt.Sprintf("Failed to initialize encryption: %v", err))
		log.Printf("Warning: Failed to initialize encryption: %v", err)
		// Don't fail startup, but log the error
	}

	// Initialize configuration
	// Load configuration
	appConfig := loadConfigFile()

	// Initialize configuration
	config := &bootstrap.Config{
		DatabasePath: getDatabasePath(),
		DeviceID:     getDeviceID(),
		DebugMode:    appConfig.DebugMode, // Load from config
		ServerURL:    getServerURL(),
		APIKey:       getAPIKey(),
	}

	// Override debug mode from environment if set
	if os.Getenv("SMARTMILL_DEBUG") == "true" {
		config.DebugMode = true
	}

	// Initialize logger
	a.logger = logger.NewLogger(config.DebugMode)
	a.logger.Info("Initializing Smart Mill Scale Core Services", map[string]interface{}{
		"device_id":  config.DeviceID,
		"debug_mode": config.DebugMode,
	})

	// Create and initialize ONLY core services needed for authentication
	a.coreApplication = bootstrap.NewCoreApplication(config)
	if err := a.coreApplication.InitializeCore(ctx); err != nil {
		a.logger.Error("Failed to initialize core services", err, nil)
		wailsruntime.LogError(ctx, fmt.Sprintf("Failed to initialize core services: %v", err))
		return
	}

	// Initialize basic Wails handler with core services only
	a.coreHandler = wails.NewWailsCoreHandler(a.coreApplication, a.logger)

	// Start mock GraphQL server in development mode
	if config.DebugMode {
		a.mockServer = sync.NewMockSyncServer(8443, 0.85, 200*time.Millisecond)
		if err := a.mockServer.Start(); err != nil {
			a.logger.Error("Failed to start mock GraphQL server", err, nil)
			wailsruntime.LogWarning(ctx, fmt.Sprintf("Mock server failed to start: %v", err))
		} else {
			log.Println("Mock GraphQL server started on http://localhost:8443/graphql")
			a.logger.Info("Mock GraphQL server started successfully", map[string]interface{}{
				"port":         8443,
				"success_rate": 85,
				"latency_ms":   200,
			})
			wailsruntime.LogInfo(ctx, "Mock GraphQL server started for testing (http://localhost:8443/graphql)")
		}
	}

	log.Println("Smart Mill Scale core services started successfully")
	a.logger.Info("Core services initialized successfully", nil)
	wailsruntime.LogInfo(ctx, "Core services initialized successfully - Ready for authentication")
}

// OnDomReady is called after front-end resources have been loaded
func (a *App) OnDomReady(ctx context.Context) {
	// Here you can make your front-end interact with the backend
}

// InitializeAuthenticatedServices initializes the full application services after successful authentication
func (a *App) InitializeAuthenticatedServices(userRole string) error {
	if a.servicesReady {
		a.logger.Info("Authenticated services already initialized", nil)
		return nil
	}

	a.logger.Info("Initializing authenticated services for user role", map[string]interface{}{
		"user_role": userRole,
	})

	// Create full application using existing core configuration
	config := a.coreApplication.GetConfig()
	a.application = bootstrap.NewApplication(config)

	if err := a.application.InitializeForRole(a.ctx, userRole); err != nil {
		a.logger.Error("Failed to initialize authenticated services", err, nil)
		return fmt.Errorf("failed to initialize authenticated services: %w", err)
	}

	// Upgrade Wails handler to full functionality
	a.handler = wails.NewWailsHandler(a.application, a.logger)

	// Create cancellable context for weight event stream
	a.weightStreamCtx, a.weightStreamCancelFunc = context.WithCancel(a.ctx)

	// Start event-driven weight monitoring only after authentication
	go a.startWeightEventStream()

	a.servicesReady = true

	a.logger.Info("Authenticated services initialized successfully", map[string]interface{}{
		"user_role": userRole,
	})

	return nil
}

// IsServicesReady returns whether authenticated services have been initialized
func (a *App) IsServicesReady() bool {
	return a.servicesReady
}


// RequireAuthenticatedServices ensures that authenticated services are initialized
func (a *App) RequireAuthenticatedServices() error {
	if !a.servicesReady {
		return fmt.Errorf("authenticated services not initialized - user must login first")
	}
	return nil
}

// ResetAuthenticatedServices cleans up authenticated services on logout
func (a *App) ResetAuthenticatedServices() error {
	a.logger.Info("Resetting authenticated services", nil)

	// Cancel the weight event stream goroutine
	if a.weightStreamCancelFunc != nil {
		a.logger.Info("Stopping weight event stream", nil)
		a.weightStreamCancelFunc()
		a.weightStreamCancelFunc = nil
		a.weightStreamCtx = nil
	}

	// Shutdown application services
	if a.application != nil {
		a.logger.Info("Shutting down application services", nil)
		if err := a.application.Shutdown(a.ctx); err != nil {
			a.logger.Error("Error during application shutdown", err, nil)
			// Continue with cleanup even if shutdown fails
		}
		a.application = nil
	}

	// Clear handler
	a.handler = nil

	// Reset services ready flag
	a.servicesReady = false

	a.logger.Info("Authenticated services reset complete", nil)
	return nil
}

// getCurrentHandler returns the appropriate handler based on service initialization state
func (a *App) getCurrentHandler() *wails.WailsHandler {
	if a.servicesReady && a.handler != nil {
		return a.handler
	}
	// Return nil or a default handler - this will be checked by callers
	return nil
}

// OnBeforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) OnBeforeClose(ctx context.Context) (prevent bool) {
	// Stop mock server if running
	if a.mockServer != nil {
		log.Println("Stopping mock GraphQL server...")
		if err := a.mockServer.Stop(); err != nil {
			log.Printf("Warning: error stopping mock server: %v", err)
		} else {
			log.Println("Mock GraphQL server stopped successfully")
		}
	}

	// Perform cleanup for authenticated services
	if a.application != nil {
		if err := a.application.Shutdown(ctx); err != nil {
			log.Printf("Warning: error during application shutdown: %v", err)
		}
	}

	// Perform cleanup for core services
	if a.coreApplication != nil {
		if err := a.coreApplication.Shutdown(ctx); err != nil {
			log.Printf("Warning: error during core services shutdown: %v", err)
		}
	}
	return false
}

// OnShutdown is called when the application is shutting down
func (a *App) OnShutdown(ctx context.Context) {
	log.Println("Smart Mill Scale application shutting down")
}

// Utility methods
