package usecase

import (
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// Container holds all use case instances with their dependencies
type Container struct {
	Dashboard    DashboardUseCase
	Metrics      MetricsUseCase
	SystemHealth SystemHealthUseCase
}

// NewContainer creates a new use case container with dependency injection
// This follows the Dependency Injection pattern to wire up all dependencies
func NewContainer(
	dashboardRepo domain.DashboardRepository,
	userRepo domain.UserRepository,
	cacheRepo domain.CacheRepository,
	logger domain.Logger,
	eventPublisher domain.EventPublisher,
	cacheTTL time.Duration,
) *Container {
	// Create use cases with their dependencies injected
	return &Container{
		Dashboard: NewDashboardUseCase(
			dashboardRepo,
			userRepo,
			cacheRepo,
			logger,
			eventPublisher,
			cacheTTL,
		),
		SystemHealth: NewSystemHealthUseCase(
			logger,
		),
	}
}

// Config holds configuration for use cases
type Config struct {
	CacheTTL time.Duration
}

// DefaultConfig returns default configuration
func DefaultConfig() Config {
	return Config{
		CacheTTL: 5 * time.Minute,
	}
}
