package usecase

import (
	"context"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// systemHealthUseCase implements SystemHealthUseCase interface
type systemHealthUseCase struct {
	logger domain.Logger
}

// NewSystemHealthUseCase creates a new system health use case with dependency injection
func NewSystemHealthUseCase(logger domain.Logger) SystemHealthUseCase {
	return &systemHealthUseCase{
		logger: logger,
	}
}

// GetSystemHealth retrieves overall system health
func (uc *systemHealthUseCase) GetSystemHealth(ctx context.Context) (*domain.SystemHealth, error) {
	now := time.Now()

	// Check health of all services
	services := make(map[string]domain.ServiceHealth)

	// Check database
	dbHealth, err := uc.CheckServiceHealth(ctx, "database")
	if err != nil {
		uc.logger.Warn("Database health check failed", domain.Field{Key: "error", Value: err.Error()})
	} else {
		services["database"] = *dbHealth
	}

	// Check serial connection
	serialHealth, err := uc.CheckServiceHealth(ctx, "serial")
	if err != nil {
		uc.logger.Warn("Serial health check failed", domain.Field{Key: "error", Value: err.Error()})
	} else {
		services["serial"] = *serialHealth
	}

	// Check sync service
	syncHealth, err := uc.CheckServiceHealth(ctx, "sync")
	if err != nil {
		uc.logger.Warn("Sync health check failed", domain.Field{Key: "error", Value: err.Error()})
	} else {
		services["sync"] = *syncHealth
	}

	// Calculate overall health score
	score, status := uc.calculateHealthScore(services)

	systemHealth := &domain.SystemHealth{
		Status:      status,
		Score:       score,
		Services:    services,
		LastChecked: now,
	}

	return systemHealth, nil
}

// CheckServiceHealth checks the health of a specific service
func (uc *systemHealthUseCase) CheckServiceHealth(ctx context.Context, serviceName string) (*domain.ServiceHealth, error) {
	startTime := time.Now()

	// This would perform actual health checks for each service
	// For now, return healthy status for all services

	health := &domain.ServiceHealth{
		Status:       "healthy",
		ResponseTime: time.Since(startTime),
		LastChecked:  time.Now(),
	}

	return health, nil
}

// GetHealthScore retrieves the current health score
func (uc *systemHealthUseCase) GetHealthScore(ctx context.Context) (int, error) {
	health, err := uc.GetSystemHealth(ctx)
	if err != nil {
		return 0, err
	}
	return health.Score, nil
}

// Helper functions

func (uc *systemHealthUseCase) calculateHealthScore(services map[string]domain.ServiceHealth) (int, string) {
	if len(services) == 0 {
		return 0, "unknown"
	}

	healthyCount := 0
	warningCount := 0
	criticalCount := 0

	for _, service := range services {
		switch service.Status {
		case "healthy":
			healthyCount++
		case "warning":
			warningCount++
		case "critical", "down":
			criticalCount++
		}
	}

	totalServices := len(services)
	score := (healthyCount * 100) / totalServices

	// Adjust score based on warnings and critical issues
	score -= (warningCount * 10)
	score -= (criticalCount * 30)

	// Ensure score is between 0 and 100
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	// Determine status based on score
	var status string
	switch {
	case score >= 80:
		status = "healthy"
	case score >= 50:
		status = "warning"
	default:
		status = "critical"
	}

	return score, status
}
