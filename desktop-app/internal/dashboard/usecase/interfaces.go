package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// DashboardUseCase defines the interface for dashboard business logic
type DashboardUseCase interface {
	// Dashboard operations
	GetDashboardData(ctx context.Context, userID uuid.UUID) (*domain.DashboardData, error)
	GetDashboardByID(ctx context.Context, id uuid.UUID) (*domain.Dashboard, error)
	CreateDashboard(ctx context.Context, dashboard *domain.Dashboard) error
	UpdateDashboard(ctx context.Context, dashboard *domain.Dashboard) error
	DeleteDashboard(ctx context.Context, id uuid.UUID) error
	GetDashboardsByRole(ctx context.Context, role domain.Role) ([]*domain.Dashboard, error)

	// Widget operations
	AddWidget(ctx context.Context, userID uuid.UUID, widget domain.Widget) error
	UpdateWidget(ctx context.Context, userID uuid.UUID, widget domain.Widget) error
	RemoveWidget(ctx context.Context, userID uuid.UUID, widgetID string) error
	GetVisibleWidgets(ctx context.Context, userID uuid.UUID) ([]domain.Widget, error)

	// Layout operations
	UpdateLayout(ctx context.Context, userID uuid.UUID, layout domain.Layout) error
	ResetToDefaultLayout(ctx context.Context, userID uuid.UUID) error

	// Refresh operations
	RefreshDashboard(ctx context.Context, userID uuid.UUID) (*domain.DashboardData, error)
	RefreshMetrics(ctx context.Context, userID uuid.UUID) (map[string]domain.Metric, error)
}

// MetricsUseCase defines the interface for metrics business logic
type MetricsUseCase interface {
	GetMetrics(ctx context.Context, userID uuid.UUID, role domain.Role) (map[string]domain.Metric, error)
	GetMetricByID(ctx context.Context, id string) (*domain.Metric, error)
	GetWeighingMetrics(ctx context.Context, timeRange domain.TimeRange) (map[string]domain.Metric, error)
	GetSyncMetrics(ctx context.Context) (map[string]domain.Metric, error)
	GetUserActivityMetrics(ctx context.Context, userID uuid.UUID) (map[string]domain.Metric, error)
}


// SystemHealthUseCase defines the interface for system health monitoring
type SystemHealthUseCase interface {
	GetSystemHealth(ctx context.Context) (*domain.SystemHealth, error)
	CheckServiceHealth(ctx context.Context, serviceName string) (*domain.ServiceHealth, error)
	GetHealthScore(ctx context.Context) (int, error)
}
