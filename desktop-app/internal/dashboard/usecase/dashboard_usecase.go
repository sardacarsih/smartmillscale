package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// dashboardUseCase implements DashboardUseCase interface
type dashboardUseCase struct {
	dashboardRepo  domain.DashboardRepository
	userRepo       domain.UserRepository
	cacheRepo      domain.CacheRepository
	logger         domain.Logger
	eventPublisher domain.EventPublisher
	cacheTTL       time.Duration
}

// NewDashboardUseCase creates a new dashboard use case with dependency injection
func NewDashboardUseCase(
	dashboardRepo domain.DashboardRepository,
	userRepo domain.UserRepository,
	cacheRepo domain.CacheRepository,
	logger domain.Logger,
	eventPublisher domain.EventPublisher,
	cacheTTL time.Duration,
) DashboardUseCase {
	return &dashboardUseCase{
		dashboardRepo:  dashboardRepo,
		userRepo:       userRepo,
		cacheRepo:      cacheRepo,
		logger:         logger,
		eventPublisher: eventPublisher,
		cacheTTL:       cacheTTL,
	}
}

// GetDashboardData retrieves complete dashboard data for a user
func (uc *dashboardUseCase) GetDashboardData(ctx context.Context, userID uuid.UUID) (*domain.DashboardData, error) {
	// Try to get from cache first
	cacheKey := fmt.Sprintf("dashboard:%s", userID.String())
	if data, err := uc.cacheRepo.GetDashboard(ctx, cacheKey); err == nil && data != nil {
		uc.logger.Debug("Dashboard data retrieved from cache", domain.Field{Key: "user_id", Value: userID})
		return data, nil
	}

	// Get user info
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		uc.logger.Error("Failed to get user", err, domain.Field{Key: "user_id", Value: userID})
		return nil, domain.ErrUserNotFound
	}

	// Get dashboard configuration
	dashboard, err := uc.dashboardRepo.GetByUserID(ctx, userID)
	if err != nil {
		uc.logger.Error("Failed to get dashboard", err, domain.Field{Key: "user_id", Value: userID})
		return nil, err
	}

	// Build dashboard data
	data := &domain.DashboardData{
		UserID:      userID,
		Role:        user.Role,
		Dashboard:   dashboard,
		Metrics:     make(map[string]domain.Metric),
		Charts:      make(map[string]domain.Chart),
		Activities:  []domain.Activity{},
		LastUpdated: time.Now(),
	}

	// Cache the result
	if err := uc.cacheRepo.SetDashboard(ctx, cacheKey, data, uc.cacheTTL); err != nil {
		uc.logger.Warn("Failed to cache dashboard data", domain.Field{Key: "user_id", Value: userID})
	}

	return data, nil
}

// GetDashboardByID retrieves a dashboard by its ID
func (uc *dashboardUseCase) GetDashboardByID(ctx context.Context, id uuid.UUID) (*domain.Dashboard, error) {
	dashboard, err := uc.dashboardRepo.GetByID(ctx, id)
	if err != nil {
		uc.logger.Error("Failed to get dashboard by ID", err, domain.Field{Key: "dashboard_id", Value: id})
		return nil, err
	}
	return dashboard, nil
}

// CreateDashboard creates a new dashboard
func (uc *dashboardUseCase) CreateDashboard(ctx context.Context, dashboard *domain.Dashboard) error {
	// Validate dashboard
	if err := dashboard.IsValid(); err != nil {
		return err
	}

	// Set timestamps
	now := time.Now()
	dashboard.CreatedAt = now
	dashboard.UpdatedAt = now

	// Save to repository
	if err := uc.dashboardRepo.Save(ctx, dashboard); err != nil {
		uc.logger.Error("Failed to create dashboard", err,
			domain.Field{Key: "user_id", Value: dashboard.UserID},
			domain.Field{Key: "role", Value: dashboard.Role})
		return err
	}

	// Publish event
	event := &domain.Event{
		Type:      "dashboard.created",
		UserID:    dashboard.UserID,
		Timestamp: now,
		Metadata:  map[string]interface{}{"dashboard_id": dashboard.ID, "role": dashboard.Role},
	}
	_ = uc.eventPublisher.PublishAsync(ctx, event)

	uc.logger.Info("Dashboard created successfully",
		domain.Field{Key: "dashboard_id", Value: dashboard.ID},
		domain.Field{Key: "user_id", Value: dashboard.UserID})

	return nil
}

// UpdateDashboard updates an existing dashboard
func (uc *dashboardUseCase) UpdateDashboard(ctx context.Context, dashboard *domain.Dashboard) error {
	// Validate dashboard
	if err := dashboard.IsValid(); err != nil {
		return err
	}

	// Update timestamp
	dashboard.UpdatedAt = time.Now()

	// Update in repository
	if err := uc.dashboardRepo.Update(ctx, dashboard); err != nil {
		uc.logger.Error("Failed to update dashboard", err, domain.Field{Key: "dashboard_id", Value: dashboard.ID})
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("dashboard:%s", dashboard.UserID.String())
	_ = uc.cacheRepo.Delete(ctx, cacheKey)

	uc.logger.Info("Dashboard updated successfully", domain.Field{Key: "dashboard_id", Value: dashboard.ID})

	return nil
}

// DeleteDashboard deletes a dashboard
func (uc *dashboardUseCase) DeleteDashboard(ctx context.Context, id uuid.UUID) error {
	// Get dashboard first to get user ID
	dashboard, err := uc.dashboardRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Delete from repository
	if err := uc.dashboardRepo.Delete(ctx, id); err != nil {
		uc.logger.Error("Failed to delete dashboard", err, domain.Field{Key: "dashboard_id", Value: id})
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("dashboard:%s", dashboard.UserID.String())
	_ = uc.cacheRepo.Delete(ctx, cacheKey)

	uc.logger.Info("Dashboard deleted successfully", domain.Field{Key: "dashboard_id", Value: id})

	return nil
}

// GetDashboardsByRole retrieves all dashboards for a specific role
func (uc *dashboardUseCase) GetDashboardsByRole(ctx context.Context, role domain.Role) ([]*domain.Dashboard, error) {
	dashboards, err := uc.dashboardRepo.GetByRole(ctx, role)
	if err != nil {
		uc.logger.Error("Failed to get dashboards by role", err, domain.Field{Key: "role", Value: role})
		return nil, err
	}
	return dashboards, nil
}

// AddWidget adds a widget to a user's dashboard
func (uc *dashboardUseCase) AddWidget(ctx context.Context, userID uuid.UUID, widget domain.Widget) error {
	// Validate widget
	if err := widget.IsValid(); err != nil {
		return err
	}

	// Add widget
	if err := uc.dashboardRepo.AddWidget(ctx, userID, widget); err != nil {
		uc.logger.Error("Failed to add widget", err,
			domain.Field{Key: "user_id", Value: userID},
			domain.Field{Key: "widget_id", Value: widget.ID})
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("dashboard:%s", userID.String())
	_ = uc.cacheRepo.Delete(ctx, cacheKey)

	uc.logger.Info("Widget added successfully",
		domain.Field{Key: "user_id", Value: userID},
		domain.Field{Key: "widget_id", Value: widget.ID})

	return nil
}

// UpdateWidget updates a widget in a user's dashboard
func (uc *dashboardUseCase) UpdateWidget(ctx context.Context, userID uuid.UUID, widget domain.Widget) error {
	// Validate widget
	if err := widget.IsValid(); err != nil {
		return err
	}

	// Update widget
	if err := uc.dashboardRepo.UpdateWidget(ctx, userID, widget); err != nil {
		uc.logger.Error("Failed to update widget", err,
			domain.Field{Key: "user_id", Value: userID},
			domain.Field{Key: "widget_id", Value: widget.ID})
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("dashboard:%s", userID.String())
	_ = uc.cacheRepo.Delete(ctx, cacheKey)

	uc.logger.Info("Widget updated successfully",
		domain.Field{Key: "user_id", Value: userID},
		domain.Field{Key: "widget_id", Value: widget.ID})

	return nil
}

// RemoveWidget removes a widget from a user's dashboard
func (uc *dashboardUseCase) RemoveWidget(ctx context.Context, userID uuid.UUID, widgetID string) error {
	if err := uc.dashboardRepo.RemoveWidget(ctx, userID, widgetID); err != nil {
		uc.logger.Error("Failed to remove widget", err,
			domain.Field{Key: "user_id", Value: userID},
			domain.Field{Key: "widget_id", Value: widgetID})
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("dashboard:%s", userID.String())
	_ = uc.cacheRepo.Delete(ctx, cacheKey)

	uc.logger.Info("Widget removed successfully",
		domain.Field{Key: "user_id", Value: userID},
		domain.Field{Key: "widget_id", Value: widgetID})

	return nil
}

// GetVisibleWidgets retrieves visible widgets for a user
func (uc *dashboardUseCase) GetVisibleWidgets(ctx context.Context, userID uuid.UUID) ([]domain.Widget, error) {
	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	// Get dashboard
	dashboard, err := uc.dashboardRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Filter visible widgets based on user role
	return dashboard.GetVisibleWidgets(user.Role), nil
}

// UpdateLayout updates a user's dashboard layout
func (uc *dashboardUseCase) UpdateLayout(ctx context.Context, userID uuid.UUID, layout domain.Layout) error {
	if err := uc.dashboardRepo.UpdateLayout(ctx, userID, layout); err != nil {
		uc.logger.Error("Failed to update layout", err, domain.Field{Key: "user_id", Value: userID})
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("dashboard:%s", userID.String())
	_ = uc.cacheRepo.Delete(ctx, cacheKey)

	uc.logger.Info("Layout updated successfully", domain.Field{Key: "user_id", Value: userID})

	return nil
}

// ResetToDefaultLayout resets a user's dashboard to the default layout
func (uc *dashboardUseCase) ResetToDefaultLayout(ctx context.Context, userID uuid.UUID) error {
	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return domain.ErrUserNotFound
	}

	// Get default layout for user's role
	defaultLayout, err := uc.dashboardRepo.GetDefaultLayout(ctx, user.Role)
	if err != nil {
		uc.logger.Error("Failed to get default layout", err,
			domain.Field{Key: "user_id", Value: userID},
			domain.Field{Key: "role", Value: user.Role})
		return err
	}

	// Update to default layout
	if err := uc.dashboardRepo.UpdateLayout(ctx, userID, *defaultLayout); err != nil {
		return err
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("dashboard:%s", userID.String())
	_ = uc.cacheRepo.Delete(ctx, cacheKey)

	uc.logger.Info("Layout reset to default", domain.Field{Key: "user_id", Value: userID})

	return nil
}

// RefreshDashboard forces a refresh of dashboard data
func (uc *dashboardUseCase) RefreshDashboard(ctx context.Context, userID uuid.UUID) (*domain.DashboardData, error) {
	// Invalidate cache first
	cacheKey := fmt.Sprintf("dashboard:%s", userID.String())
	_ = uc.cacheRepo.Delete(ctx, cacheKey)

	// Get fresh data
	return uc.GetDashboardData(ctx, userID)
}

// RefreshMetrics refreshes only the metrics portion of the dashboard
func (uc *dashboardUseCase) RefreshMetrics(ctx context.Context, userID uuid.UUID) (map[string]domain.Metric, error) {
	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	// This would integrate with MetricsUseCase
	// For now, return empty map
	metrics := make(map[string]domain.Metric)

	// Cache the metrics
	cacheKey := fmt.Sprintf("metrics:%s", userID.String())
	_ = uc.cacheRepo.SetMetrics(ctx, cacheKey, metrics, uc.cacheTTL)

	uc.logger.Debug("Metrics refreshed", domain.Field{Key: "user_id", Value: userID}, domain.Field{Key: "role", Value: user.Role})

	return metrics, nil
}
