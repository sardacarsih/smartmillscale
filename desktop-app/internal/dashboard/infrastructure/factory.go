package infrastructure

import (
	"context"
	"database/sql"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/repository/cache"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/repository/sqlite"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/usecase"
)

// DashboardService aggregates all dashboard components
type DashboardService struct {
	// Repositories
	DashboardRepo domain.DashboardRepository
	UserRepo      domain.UserRepository
	CacheRepo     domain.CacheRepository

	// Infrastructure
	Logger         domain.Logger
	EventPublisher domain.EventPublisher

	// Use Cases
	UseCases *usecase.Container
}

// Config holds configuration for dashboard service
type Config struct {
	DB               *sql.DB
	CacheTTL         time.Duration
	EventWorkers     int
	ServiceName      string
	ServiceVersion   string
	EnableStructured bool
}

// DefaultConfig returns default configuration
func DefaultConfig(db *sql.DB) Config {
	return Config{
		DB:               db,
		CacheTTL:         5 * time.Minute,
		EventWorkers:     4,
		ServiceName:      "smart-mill-scale",
		ServiceVersion:   "1.0.0",
		EnableStructured: false,
	}
}

// NewDashboardService creates a new dashboard service with all dependencies wired up
func NewDashboardService(config Config) (*DashboardService, error) {
	// Run migrations
	if err := sqlite.RunMigrations(config.DB); err != nil {
		return nil, err
	}

	// Create repositories
	dashboardRepo := sqlite.NewDashboardRepository(config.DB)
	userRepo := sqlite.NewUserRepository(config.DB)
	cacheRepo := cache.NewMemoryCache()

	// Create infrastructure
	var logger domain.Logger
	if config.EnableStructured {
		logger = NewStructuredLogger(config.ServiceName, config.ServiceVersion)
	} else {
		logger = NewLogger()
	}

	eventPublisher := NewEventPublisher(config.EventWorkers)

	// Create use case container
	useCases := usecase.NewContainer(
		dashboardRepo,
		userRepo,
		cacheRepo,
		logger,
		eventPublisher,
		config.CacheTTL,
	)

	// Setup event handlers
	setupEventHandlers(eventPublisher, logger)

	service := &DashboardService{
		DashboardRepo:  dashboardRepo,
		UserRepo:       userRepo,
		CacheRepo:      cacheRepo,
		Logger:         logger,
		EventPublisher: eventPublisher,
		UseCases:       useCases,
	}

	logger.Info("Dashboard service initialized successfully")

	return service, nil
}

// setupEventHandlers configures default event handlers
func setupEventHandlers(
	publisher domain.EventPublisher,
	logger domain.Logger,
) {
	// Subscribe to all dashboard events and log them
	_ = publisher.Subscribe("dashboard.*", func(ctx context.Context, event *domain.Event) error {
		logger.Info("Dashboard event received",
			domain.Field{Key: "event_type", Value: event.Type},
			domain.Field{Key: "user_id", Value: event.UserID})
		return nil
	})

	// Subscribe to all widget events
	_ = publisher.Subscribe("widget.*", func(ctx context.Context, event *domain.Event) error {
		logger.Info("Widget event received",
			domain.Field{Key: "event_type", Value: event.Type},
			domain.Field{Key: "user_id", Value: event.UserID})
		return nil
	})

	// Subscribe to user events and log them
	_ = publisher.Subscribe("user.*", func(ctx context.Context, event *domain.Event) error {
		logger.Info("User event received",
			domain.Field{Key: "event_type", Value: event.Type},
			domain.Field{Key: "user_id", Value: event.UserID})
		return nil
	})
}

// Shutdown gracefully shuts down the dashboard service
func (s *DashboardService) Shutdown() {
	s.Logger.Info("Shutting down dashboard service...")
	// Add cleanup logic here if needed
}
