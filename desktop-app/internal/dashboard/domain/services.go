package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// DashboardService defines the interface for dashboard business operations
type DashboardService interface {
	// Dashboard management
	GetDashboard(ctx context.Context, userID uuid.UUID) (*DashboardData, error)
	CreateDashboard(ctx context.Context, userID uuid.UUID, role Role) (*Dashboard, error)
	UpdateDashboard(ctx context.Context, userID uuid.UUID, dashboard *Dashboard) error
	DeleteDashboard(ctx context.Context, userID uuid.UUID) error
	RefreshDashboard(ctx context.Context, userID uuid.UUID) (*DashboardData, error)

	// Layout management
	UpdateLayout(ctx context.Context, userID uuid.UUID, layout Layout) error
	GetDefaultLayout(ctx context.Context, role Role) (*Layout, error)
	ResetToDefault(ctx context.Context, userID uuid.UUID) error

	// Widget management
	AddWidget(ctx context.Context, userID uuid.UUID, widget Widget) error
	UpdateWidget(ctx context.Context, userID uuid.UUID, widget Widget) error
	RemoveWidget(ctx context.Context, userID uuid.UUID, widgetID string) error
	GetWidget(ctx context.Context, userID uuid.UUID, widgetID string) (*Widget, error)
	ReorderWidgets(ctx context.Context, userID uuid.UUID, widgetOrder []string) error

	// Dashboard data
	GetDashboardMetrics(ctx context.Context, userID uuid.UUID) (map[string]Metric, error)
	GetDashboardCharts(ctx context.Context, userID uuid.UUID) (map[string]Chart, error)
	GetRecentActivities(ctx context.Context, userID uuid.UUID, limit int) ([]Activity, error)
	GetSystemHealth(ctx context.Context) (*SystemHealth, error)
}


// MetricsService defines the interface for metrics calculations
type MetricsService interface {
	// User metrics
	CalculateUserMetrics(ctx context.Context, userID uuid.UUID, timeRange TimeRange) (*UserMetrics, error)
	CalculateRoleMetrics(ctx context.Context, role Role, timeRange TimeRange) (*RoleMetrics, error)

	// System metrics
	CalculateSystemMetrics(ctx context.Context) (*SystemMetrics, error)
	CalculatePerformanceMetrics(ctx context.Context, timeRange TimeRange) (*PerformanceSummary, error)

	// Real-time metrics
	GetRealtimeMetrics(ctx context.Context) (*RealtimeMetrics, error)
	GetLiveUserCount(ctx context.Context) (int, error)

	// Historical metrics
	GetHistoricalMetrics(ctx context.Context, metricType string, timeRange TimeRange) ([]*HistoricalMetric, error)
}

// ConfigService defines the interface for configuration management
type ConfigService interface {
	// Dashboard configuration
	GetDashboardConfig(ctx context.Context, role Role) (*DashboardConfig, error)
	UpdateDashboardConfig(ctx context.Context, role Role, config *DashboardConfig) error
	GetWidgetConfigs(ctx context.Context) ([]*WidgetConfig, error)

	// System configuration
	GetSystemConfig(ctx context.Context) (*SystemConfig, error)
	UpdateSystemConfig(ctx context.Context, config *SystemConfig) error

	// User preferences
	GetUserPreferences(ctx context.Context, userID uuid.UUID) (*UserPreferences, error)
	UpdateUserPreferences(ctx context.Context, userID uuid.UUID, preferences *UserPreferences) error
}

// NotificationService defines the interface for notifications
type NotificationService interface {
	// Send notifications
	SendNotification(ctx context.Context, notification *Notification) error
	SendBulkNotifications(ctx context.Context, notifications []*Notification) error

	// Notification management
	GetNotifications(ctx context.Context, userID uuid.UUID, filter NotificationFilter) ([]*Notification, error)
	MarkAsRead(ctx context.Context, userID uuid.UUID, notificationIDs []uuid.UUID) error
	DeleteNotification(ctx context.Context, userID uuid.UUID, notificationID uuid.UUID) error

	// Preferences
	GetNotificationPreferences(ctx context.Context, userID uuid.UUID) (*NotificationPreferences, error)
	UpdateNotificationPreferences(ctx context.Context, userID uuid.UUID, preferences *NotificationPreferences) error
}

// Additional domain models for services

// UserMetrics represents metrics for a specific user
type UserMetrics struct {
	UserID            uuid.UUID            `json:"user_id"`
	TotalSessions     int                  `json:"total_sessions"`
	TotalDashboardViews int                 `json:"total_dashboard_views"`
	AvgSessionTime    time.Duration        `json:"avg_session_time"`
	LastActive        time.Time            `json:"last_active"`
	WidgetUsage       map[string]int       `json:"widget_usage"`
	FeatureUsage      map[string]int       `json:"feature_usage"`
	ErrorCount        int                  `json:"error_count"`
	ExportCount       int                  `json:"export_count"`
	CustomizationCount int                 `json:"customization_count"`
}

// RoleMetrics represents metrics for a specific role
type RoleMetrics struct {
	Role               Role                 `json:"role"`
	TotalUsers         int                  `json:"total_users"`
	ActiveUsers        int                  `json:"active_users"`
	TotalSessions      int                  `json:"total_sessions"`
	AvgSessionTime     time.Duration        `json:"avg_session_time"`
	PopularWidgets     []WidgetMetric       `json:"popular_widgets"`
	PopularFeatures    []FeatureMetric      `json:"popular_features"`
	ErrorRate          float64              `json:"error_rate"`
	PerformanceScore   float64              `json:"performance_score"`
}

// FeatureMetric represents feature usage statistics
type FeatureMetric struct {
	Feature    string    `json:"feature"`
	UsageCount int       `json:"usage_count"`
	LastUsed   time.Time `json:"last_used"`
	AvgTime    int       `json:"avg_time"` // in milliseconds
}

// SystemMetrics represents overall system metrics
type SystemMetrics struct {
	TotalUsers        int                    `json:"total_users"`
	ActiveUsers       int                    `json:"active_users"`
	TotalSessions     int                    `json:"total_sessions"`
	SystemHealth      *SystemHealth          `json:"system_health"`
	PerformanceScore  float64                `json:"performance_score"`
	ErrorRate         float64                `json:"error_rate"`
	Uptime            time.Duration          `json:"uptime"`
	ResourceUsage     *ResourceUsage         `json:"resource_usage"`
	LastUpdated       time.Time              `json:"last_updated"`
}

// ResourceUsage represents system resource usage
type ResourceUsage struct {
	CPUUsage    float64 `json:"cpu_usage"`    // percentage
	MemoryUsage float64 `json:"memory_usage"` // percentage
	DiskUsage   float64 `json:"disk_usage"`   // percentage
	NetworkIO   int64   `json:"network_io"`   // bytes per second
}

// PerformanceSummary represents performance metrics summary
type PerformanceSummary struct {
	AvgResponseTime   time.Duration `json:"avg_response_time"`
	MinResponseTime   time.Duration `json:"min_response_time"`
	MaxResponseTime   time.Duration `json:"max_response_time"`
	P95ResponseTime   time.Duration `json:"p95_response_time"`
	P99ResponseTime   time.Duration `json:"p99_response_time"`
	SuccessRate       float64       `json:"success_rate"`
	ErrorRate         float64       `json:"error_rate"`
	TotalRequests     int           `json:"total_requests"`
	TimeRange         TimeRange     `json:"time_range"`
}

// RealtimeMetrics represents real-time system metrics
type RealtimeMetrics struct {
	Timestamp        time.Time              `json:"timestamp"`
	ActiveUsers      int                    `json:"active_users"`
	CurrentSessions  int                    `json:"current_sessions"`
	RecentActivity   []Activity             `json:"recent_activity"`
	SystemHealth     *SystemHealth          `json:"system_health"`
	LoadMetrics      *LoadMetrics           `json:"load_metrics"`
}

// LoadMetrics represents current system load
type LoadMetrics struct {
	RequestsPerSecond int     `json:"requests_per_second"`
	AvgResponseTime   int     `json:"avg_response_time"` // milliseconds
	ErrorRate         float64 `json:"error_rate"`
	QueueSize         int     `json:"queue_size"`
}

// HistoricalMetric represents a metric with timestamp
type HistoricalMetric struct {
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// DashboardConfig represents dashboard configuration
type DashboardConfig struct {
	Role          Role                  `json:"role"`
	DefaultLayout Layout                `json:"default_layout"`
	Widgets       []WidgetConfig        `json:"widgets"`
	RefreshInterval time.Duration       `json:"refresh_interval"`
	CacheTimeout   time.Duration        `json:"cache_timeout"`
	Features       map[string]bool      `json:"features"`
	Themes         []ThemeConfig        `json:"themes"`
}

// WidgetConfig represents widget configuration
type WidgetConfig struct {
	ID           string                 `json:"id"`
	Type         WidgetType             `json:"type"`
	Name         string                 `json:"name"`
	Description  string                 `json:"description"`
	DefaultSize  WidgetPos              `json:"default_size"`
	Config       map[string]interface{} `json:"config"`
	RequiredRole Role                   `json:"required_role"`
	Enabled      bool                   `json:"enabled"`
}

// ThemeConfig represents theme configuration
type ThemeConfig struct {
	Name        string                 `json:"name"`
	DisplayName string                 `json:"display_name"`
	Colors      map[string]string      `json:"colors"`
	Custom      map[string]interface{} `json:"custom,omitempty"`
}

// SystemConfig represents system configuration
type SystemConfig struct {
	CacheEnabled        bool          `json:"cache_enabled"`
	CacheTimeout        time.Duration `json:"cache_timeout"`
	PerformanceMonitoring bool       `json:"performance_monitoring"`
	LogLevel            string        `json:"log_level"`
	MaintenanceMode     bool          `json:"maintenance_mode"`
	Features            map[string]bool `json:"features"`
}

// UserPreferences represents user preferences
type UserPreferences struct {
	UserID         uuid.UUID             `json:"user_id"`
	Theme          string                `json:"theme"`
	Language       string                `json:"language"`
	Timezone       string                `json:"timezone"`
	DateFormat     string                `json:"date_format"`
	TimeFormat     string                `json:"time_format"`
	Notifications  NotificationPreferences `json:"notifications"`
	Dashboard      *DashboardPreferences `json:"dashboard"`
	Custom         map[string]interface{} `json:"custom,omitempty"`
	UpdatedAt      time.Time             `json:"updated_at"`
}

// DashboardPreferences represents dashboard-specific preferences
type DashboardPreferences struct {
	AutoRefresh    bool     `json:"auto_refresh"`
	RefreshInterval int     `json:"refresh_interval"` // seconds
	DefaultView    string   `json:"default_view"`
	HiddenWidgets  []string `json:"hidden_widgets"`
	CompactMode    bool     `json:"compact_mode"`
	ShowLabels     bool     `json:"show_labels"`
}

// Notification represents a system notification
type Notification struct {
	ID        uuid.UUID              `json:"id"`
	UserID    uuid.UUID              `json:"user_id"`
	Type      NotificationType       `json:"type"`
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data,omitempty"`
	IsRead    bool                   `json:"is_read"`
	CreatedAt time.Time              `json:"created_at"`
	ReadAt    *time.Time             `json:"read_at,omitempty"`
	ExpiresAt *time.Time             `json:"expires_at,omitempty"`
}

// NotificationType represents different notification types
type NotificationType string

const (
	NotificationInfo     NotificationType = "info"
	NotificationSuccess  NotificationType = "success"
	NotificationWarning  NotificationType = "warning"
	NotificationError    NotificationType = "error"
	NotificationSystem   NotificationType = "system"
)

// NotificationFilter represents filters for notifications
type NotificationFilter struct {
	Types     []NotificationType `json:"types,omitempty"`
	IsRead    *bool              `json:"is_read,omitempty"`
	DateRange *TimeRange         `json:"date_range,omitempty"`
	Limit     int                `json:"limit,omitempty"`
	Offset    int                `json:"offset,omitempty"`
}

// NotificationPreferences represents user notification preferences
type NotificationPreferences struct {
	EmailEnabled    bool     `json:"email_enabled"`
	PushEnabled     bool     `json:"push_enabled"`
	Types           map[string]bool `json:"types"`
	QuietHours      *QuietHours `json:"quiet_hours,omitempty"`
	Frequency       string   `json:"frequency"`
}

// QuietHours represents quiet hours configuration
type QuietHours struct {
	Start string `json:"start"` // HH:MM format
	End   string `json:"end"`   // HH:MM format
	Timezone string `json:"timezone"`
}


