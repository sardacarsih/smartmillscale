package domain

import (
	"time"

	"github.com/google/uuid"
)

// Role represents user roles in the system
type Role string

const (
	RoleAdmin      Role = "ADMIN"
	RoleSupervisor Role = "SUPERVISOR"
	RoleTimbangan  Role = "TIMBANGAN"
	RoleGrading    Role = "GRADING"
)

// IsValid checks if the role is valid
func (r Role) IsValid() bool {
	switch r {
	case RoleAdmin, RoleSupervisor, RoleTimbangan, RoleGrading:
		return true
	default:
		return false
	}
}

// HasPermission checks if role has permission for target role
func (r Role) HasPermission(targetRole Role) bool {
	roleHierarchy := map[Role]int{
		RoleAdmin:      4,
		RoleSupervisor: 3,
		RoleTimbangan:  2,
		RoleGrading:    1,
	}

	return roleHierarchy[r] >= roleHierarchy[targetRole]
}

// WidgetType represents different widget types
type WidgetType string

const (
	WidgetMetricCard     WidgetType = "metric_card"
	WidgetChart          WidgetType = "chart"
	WidgetRecentActivity WidgetType = "recent_activity"
	WidgetSystemHealth   WidgetType = "system_health"
	WidgetUserActivity   WidgetType = "user_activity"
	WidgetSyncStatus     WidgetType = "sync_status"
	WidgetQuickActions   WidgetType = "quick_actions"
)

// ChartType represents different chart types
type ChartType string

const (
	ChartLine ChartType = "line"
	ChartBar  ChartType = "bar"
	ChartPie  ChartType = "pie"
	ChartArea ChartType = "area"
)

// Layout represents dashboard layout configuration
type Layout struct {
	Columns   int                    `json:"columns"`
	WidgetMap map[string]WidgetPos   `json:"widget_map"`
	Theme     string                 `json:"theme"`
	Custom    map[string]interface{} `json:"custom,omitempty"`
}

// WidgetPos represents widget position and size
type WidgetPos struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

// Widget represents a dashboard widget
type Widget struct {
	ID          string                 `json:"id"`
	Type        WidgetType             `json:"type"`
	Title       string                 `json:"title"`
	Position    WidgetPos              `json:"position"`
	Config      map[string]interface{} `json:"config"`
	RequiredRole Role                   `json:"required_role"`
	IsVisible   bool                   `json:"is_visible"`
	Refreshable bool                   `json:"refreshable"`
}

// Dashboard represents a user's dashboard configuration
type Dashboard struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Role        Role       `json:"role"`
	Layout      Layout     `json:"layout"`
	Widgets     []Widget   `json:"widgets"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	LastViewed  *time.Time `json:"last_viewed,omitempty"`
}

// Metric represents a dashboard metric
type Metric struct {
	ID       string                 `json:"id"`
	Name     string                 `json:"name"`
	Value    interface{}            `json:"value"`
	Unit     string                 `json:"unit"`
	Trend    *Trend                 `json:"trend,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// Trend represents metric trend information
type Trend struct {
	Direction string  `json:"direction"` // "up", "down", "stable"
	Percent   float64 `json:"percent"`
	Value     float64 `json:"value"`
	Period    string  `json:"period"`
}

// DashboardData represents the complete dashboard data for a user
type DashboardData struct {
	UserID      uuid.UUID            `json:"user_id"`
	Role        Role                 `json:"role"`
	Dashboard   *Dashboard           `json:"dashboard,omitempty"`
	Metrics     map[string]Metric    `json:"metrics"`
	Charts      map[string]Chart     `json:"charts"`
	Activities  []Activity           `json:"activities"`
	SystemHealth *SystemHealth        `json:"system_health,omitempty"`
	LastUpdated time.Time            `json:"last_updated"`
}

// Chart represents dashboard chart data
type Chart struct {
	ID       string                 `json:"id"`
	Type     ChartType              `json:"type"`
	Title    string                 `json:"title"`
	Data     []ChartDataPoint       `json:"data"`
	Options  map[string]interface{} `json:"options,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// ChartDataPoint represents a single data point in a chart
type ChartDataPoint struct {
	Label string      `json:"label"`
	Value interface{} `json:"value"`
	Meta  map[string]interface{} `json:"meta,omitempty"`
}

// Activity represents a recent activity
type Activity struct {
	ID        uuid.UUID              `json:"id"`
	Type      string                 `json:"type"`
	Title     string                 `json:"title"`
	Description string                `json:"description"`
	User      string                 `json:"user"`
	Timestamp time.Time              `json:"timestamp"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// SystemHealth represents system health information
type SystemHealth struct {
	Status       string                 `json:"status"` // "healthy", "warning", "critical"
	Score        int                    `json:"score"`  // 0-100
	Services     map[string]ServiceHealth `json:"services"`
	LastChecked  time.Time              `json:"last_checked"`
}

// ServiceHealth represents health of a specific service
type ServiceHealth struct {
	Status      string        `json:"status"`
	ResponseTime time.Duration `json:"response_time"`
	LastError   *string       `json:"last_error,omitempty"`
	LastChecked time.Time     `json:"last_checked"`
}

// IsValid validates the dashboard
func (d *Dashboard) IsValid() error {
	if d.UserID == uuid.Nil {
		return ErrInvalidUserID
	}
	if !d.Role.IsValid() {
		return ErrInvalidRole
	}
	if len(d.Widgets) == 0 {
		return ErrNoWidgets
	}
	for _, widget := range d.Widgets {
		if err := widget.IsValid(); err != nil {
			return err
		}
	}
	return nil
}

// IsValid validates a widget
func (w *Widget) IsValid() error {
	if w.ID == "" {
		return ErrInvalidWidgetID
	}
	if !w.RequiredRole.IsValid() {
		return ErrInvalidRole
	}
	return nil
}

// CanAccess checks if a role can access this widget
func (w *Widget) CanAccess(userRole Role) bool {
	return userRole.HasPermission(w.RequiredRole)
}

// GetVisibleWidgets returns widgets visible to the given role
func (d *Dashboard) GetVisibleWidgets(userRole Role) []Widget {
	var visible []Widget
	for _, widget := range d.Widgets {
		if widget.IsVisible && widget.CanAccess(userRole) {
			visible = append(visible, widget)
		}
	}
	return visible
}

// HasWidget checks if dashboard has a specific widget
func (d *Dashboard) HasWidget(widgetID string) bool {
	for _, widget := range d.Widgets {
		if widget.ID == widgetID {
			return true
		}
	}
	return false
}

// GetWidgetByID returns a widget by its ID
func (d *Dashboard) GetWidgetByID(widgetID string) *Widget {
	for _, widget := range d.Widgets {
		if widget.ID == widgetID {
			return &widget
		}
	}
	return nil
}

// Additional types needed for the dashboard domain

// User represents a user entity
type User struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	FullName    string    `json:"full_name"`
	Email       string    `json:"email"`
	Role        Role      `json:"role"`
	IsActive    bool      `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Event represents a system event
type Event struct {
	ID        uuid.UUID              `json:"id"`
	Type      string                 `json:"type"`
	UserID    uuid.UUID              `json:"user_id"`
	Timestamp time.Time              `json:"timestamp"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// TimeRange represents a time range for filtering
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// WidgetMetric represents metrics for a specific widget
type WidgetMetric struct {
	WidgetID   string                 `json:"widget_id"`
	MetricType string                 `json:"metric_type"`
	Value      interface{}            `json:"value"`
	Unit       string                 `json:"unit"`
	Timestamp  time.Time              `json:"timestamp"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}