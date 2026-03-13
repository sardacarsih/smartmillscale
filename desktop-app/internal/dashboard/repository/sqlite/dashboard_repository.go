package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// dashboardRepository implements domain.DashboardRepository using SQLite
type dashboardRepository struct {
	db *sql.DB
}

// NewDashboardRepository creates a new SQLite dashboard repository
func NewDashboardRepository(db *sql.DB) domain.DashboardRepository {
	return &dashboardRepository{db: db}
}

// GetByUserID retrieves a dashboard by user ID
func (r *dashboardRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Dashboard, error) {
	query := `
		SELECT id, user_id, role, layout, widgets, is_active, created_at, updated_at, last_viewed
		FROM dashboards
		WHERE user_id = ?
		LIMIT 1
	`

	var dashboard domain.Dashboard
	var layoutJSON, widgetsJSON []byte
	var lastViewed sql.NullTime

	err := r.db.QueryRowContext(ctx, query, userID.String()).Scan(
		&dashboard.ID,
		&dashboard.UserID,
		&dashboard.Role,
		&layoutJSON,
		&widgetsJSON,
		&dashboard.IsActive,
		&dashboard.CreatedAt,
		&dashboard.UpdatedAt,
		&lastViewed,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrDashboardNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get dashboard: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(layoutJSON, &dashboard.Layout); err != nil {
		return nil, fmt.Errorf("failed to unmarshal layout: %w", err)
	}
	if err := json.Unmarshal(widgetsJSON, &dashboard.Widgets); err != nil {
		return nil, fmt.Errorf("failed to unmarshal widgets: %w", err)
	}

	if lastViewed.Valid {
		dashboard.LastViewed = &lastViewed.Time
	}

	return &dashboard, nil
}

// GetByID retrieves a dashboard by its ID
func (r *dashboardRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Dashboard, error) {
	query := `
		SELECT id, user_id, role, layout, widgets, is_active, created_at, updated_at, last_viewed
		FROM dashboards
		WHERE id = ?
		LIMIT 1
	`

	var dashboard domain.Dashboard
	var layoutJSON, widgetsJSON []byte
	var lastViewed sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&dashboard.ID,
		&dashboard.UserID,
		&dashboard.Role,
		&layoutJSON,
		&widgetsJSON,
		&dashboard.IsActive,
		&dashboard.CreatedAt,
		&dashboard.UpdatedAt,
		&lastViewed,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrDashboardNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get dashboard: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(layoutJSON, &dashboard.Layout); err != nil {
		return nil, fmt.Errorf("failed to unmarshal layout: %w", err)
	}
	if err := json.Unmarshal(widgetsJSON, &dashboard.Widgets); err != nil {
		return nil, fmt.Errorf("failed to unmarshal widgets: %w", err)
	}

	if lastViewed.Valid {
		dashboard.LastViewed = &lastViewed.Time
	}

	return &dashboard, nil
}

// Save creates a new dashboard
func (r *dashboardRepository) Save(ctx context.Context, dashboard *domain.Dashboard) error {
	// Generate ID if not set
	if dashboard.ID == uuid.Nil {
		dashboard.ID = uuid.New()
	}

	// Marshal JSON fields
	layoutJSON, err := json.Marshal(dashboard.Layout)
	if err != nil {
		return fmt.Errorf("failed to marshal layout: %w", err)
	}

	widgetsJSON, err := json.Marshal(dashboard.Widgets)
	if err != nil {
		return fmt.Errorf("failed to marshal widgets: %w", err)
	}

	query := `
		INSERT INTO dashboards (id, user_id, role, layout, widgets, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = r.db.ExecContext(ctx, query,
		dashboard.ID.String(),
		dashboard.UserID.String(),
		dashboard.Role,
		layoutJSON,
		widgetsJSON,
		dashboard.IsActive,
		dashboard.CreatedAt,
		dashboard.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to save dashboard: %w", err)
	}

	return nil
}

// Update updates an existing dashboard
func (r *dashboardRepository) Update(ctx context.Context, dashboard *domain.Dashboard) error {
	// Marshal JSON fields
	layoutJSON, err := json.Marshal(dashboard.Layout)
	if err != nil {
		return fmt.Errorf("failed to marshal layout: %w", err)
	}

	widgetsJSON, err := json.Marshal(dashboard.Widgets)
	if err != nil {
		return fmt.Errorf("failed to marshal widgets: %w", err)
	}

	query := `
		UPDATE dashboards
		SET role = ?, layout = ?, widgets = ?, is_active = ?, updated_at = ?, last_viewed = ?
		WHERE id = ?
	`

	var lastViewed interface{}
	if dashboard.LastViewed != nil {
		lastViewed = *dashboard.LastViewed
	}

	result, err := r.db.ExecContext(ctx, query,
		dashboard.Role,
		layoutJSON,
		widgetsJSON,
		dashboard.IsActive,
		dashboard.UpdatedAt,
		lastViewed,
		dashboard.ID.String(),
	)

	if err != nil {
		return fmt.Errorf("failed to update dashboard: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return domain.ErrDashboardNotFound
	}

	return nil
}

// Delete deletes a dashboard
func (r *dashboardRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM dashboards WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, id.String())
	if err != nil {
		return fmt.Errorf("failed to delete dashboard: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return domain.ErrDashboardNotFound
	}

	return nil
}

// GetByRole retrieves all dashboards for a specific role
func (r *dashboardRepository) GetByRole(ctx context.Context, role domain.Role) ([]*domain.Dashboard, error) {
	query := `
		SELECT id, user_id, role, layout, widgets, is_active, created_at, updated_at, last_viewed
		FROM dashboards
		WHERE role = ?
	`

	rows, err := r.db.QueryContext(ctx, query, role)
	if err != nil {
		return nil, fmt.Errorf("failed to query dashboards: %w", err)
	}
	defer rows.Close()

	var dashboards []*domain.Dashboard

	for rows.Next() {
		var dashboard domain.Dashboard
		var layoutJSON, widgetsJSON []byte
		var lastViewed sql.NullTime

		err := rows.Scan(
			&dashboard.ID,
			&dashboard.UserID,
			&dashboard.Role,
			&layoutJSON,
			&widgetsJSON,
			&dashboard.IsActive,
			&dashboard.CreatedAt,
			&dashboard.UpdatedAt,
			&lastViewed,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan dashboard: %w", err)
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(layoutJSON, &dashboard.Layout); err != nil {
			return nil, fmt.Errorf("failed to unmarshal layout: %w", err)
		}
		if err := json.Unmarshal(widgetsJSON, &dashboard.Widgets); err != nil {
			return nil, fmt.Errorf("failed to unmarshal widgets: %w", err)
		}

		if lastViewed.Valid {
			dashboard.LastViewed = &lastViewed.Time
		}

		dashboards = append(dashboards, &dashboard)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return dashboards, nil
}

// UpdateLayout updates the layout for a user's dashboard
func (r *dashboardRepository) UpdateLayout(ctx context.Context, userID uuid.UUID, layout domain.Layout) error {
	layoutJSON, err := json.Marshal(layout)
	if err != nil {
		return fmt.Errorf("failed to marshal layout: %w", err)
	}

	query := `
		UPDATE dashboards
		SET layout = ?, updated_at = ?
		WHERE user_id = ?
	`

	result, err := r.db.ExecContext(ctx, query, layoutJSON, time.Now(), userID.String())
	if err != nil {
		return fmt.Errorf("failed to update layout: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return domain.ErrDashboardNotFound
	}

	return nil
}

// GetDefaultLayout retrieves the default layout for a role
func (r *dashboardRepository) GetDefaultLayout(ctx context.Context, role domain.Role) (*domain.Layout, error) {
	query := `
		SELECT layout
		FROM dashboard_templates
		WHERE role = ?
		LIMIT 1
	`

	var layoutJSON []byte
	err := r.db.QueryRowContext(ctx, query, role).Scan(&layoutJSON)

	if err == sql.ErrNoRows {
		// Return a default layout if no template exists
		return r.createDefaultLayout(role), nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get default layout: %w", err)
	}

	var layout domain.Layout
	if err := json.Unmarshal(layoutJSON, &layout); err != nil {
		return nil, fmt.Errorf("failed to unmarshal layout: %w", err)
	}

	return &layout, nil
}

// AddWidget adds a widget to a user's dashboard
func (r *dashboardRepository) AddWidget(ctx context.Context, userID uuid.UUID, widget domain.Widget) error {
	// Get current dashboard
	dashboard, err := r.GetByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// Add widget
	dashboard.Widgets = append(dashboard.Widgets, widget)
	dashboard.UpdatedAt = time.Now()

	// Update dashboard
	return r.Update(ctx, dashboard)
}

// UpdateWidget updates a widget in a user's dashboard
func (r *dashboardRepository) UpdateWidget(ctx context.Context, userID uuid.UUID, widget domain.Widget) error {
	// Get current dashboard
	dashboard, err := r.GetByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// Find and update widget
	found := false
	for i, w := range dashboard.Widgets {
		if w.ID == widget.ID {
			dashboard.Widgets[i] = widget
			found = true
			break
		}
	}

	if !found {
		return domain.ErrWidgetNotFound
	}

	dashboard.UpdatedAt = time.Now()

	// Update dashboard
	return r.Update(ctx, dashboard)
}

// RemoveWidget removes a widget from a user's dashboard
func (r *dashboardRepository) RemoveWidget(ctx context.Context, userID uuid.UUID, widgetID string) error {
	// Get current dashboard
	dashboard, err := r.GetByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// Find and remove widget
	found := false
	newWidgets := make([]domain.Widget, 0)
	for _, w := range dashboard.Widgets {
		if w.ID != widgetID {
			newWidgets = append(newWidgets, w)
		} else {
			found = true
		}
	}

	if !found {
		return domain.ErrWidgetNotFound
	}

	dashboard.Widgets = newWidgets
	dashboard.UpdatedAt = time.Now()

	// Update dashboard
	return r.Update(ctx, dashboard)
}

// Helper function to create default layout based on role
func (r *dashboardRepository) createDefaultLayout(role domain.Role) *domain.Layout {
	return &domain.Layout{
		Columns:   12,
		WidgetMap: make(map[string]domain.WidgetPos),
		Theme:     "dark",
	}
}
