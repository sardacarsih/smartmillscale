package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// DashboardRepository defines the interface for dashboard data operations
type DashboardRepository interface {
	// Dashboard operations
	GetByUserID(ctx context.Context, userID uuid.UUID) (*Dashboard, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Dashboard, error)
	Save(ctx context.Context, dashboard *Dashboard) error
	Update(ctx context.Context, dashboard *Dashboard) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetByRole(ctx context.Context, role Role) ([]*Dashboard, error)

	// Layout operations
	UpdateLayout(ctx context.Context, userID uuid.UUID, layout Layout) error
	GetDefaultLayout(ctx context.Context, role Role) (*Layout, error)

	// Widget operations
	AddWidget(ctx context.Context, userID uuid.UUID, widget Widget) error
	UpdateWidget(ctx context.Context, userID uuid.UUID, widget Widget) error
	RemoveWidget(ctx context.Context, userID uuid.UUID, widgetID string) error
}


// CacheRepository defines the interface for caching operations
type CacheRepository interface {
	// Dashboard cache
	GetDashboard(ctx context.Context, key string) (*DashboardData, error)
	SetDashboard(ctx context.Context, key string, data *DashboardData, ttl time.Duration) error
	InvalidateDashboard(ctx context.Context, userID uuid.UUID) error

	// Metrics cache
	GetMetrics(ctx context.Context, key string) (map[string]Metric, error)
	SetMetrics(ctx context.Context, key string, metrics map[string]Metric, ttl time.Duration) error

	// Generic cache operations
	Get(ctx context.Context, key string) (interface{}, error)
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
	Clear(ctx context.Context, pattern string) error

	// Cache statistics
	HitRate() (float64, error)
	MissRate() (float64, error)
	Size() (int64, error)
}

// UserRepository defines the interface for user data operations
type UserRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	UpdateLastLogin(ctx context.Context, id uuid.UUID) error
	GetActiveUsers(ctx context.Context) ([]*User, error)
	GetUsersByRole(ctx context.Context, role Role) ([]*User, error)
}

// EventPublisher defines the interface for publishing events
type EventPublisher interface {
	Publish(ctx context.Context, event *Event) error
	PublishAsync(ctx context.Context, event *Event) error
	Subscribe(pattern string, handler EventHandler) error
	Unsubscribe(pattern string) error
}

// Logger defines the interface for logging operations
type Logger interface {
	Info(message string, fields ...Field)
	Warn(message string, fields ...Field)
	Error(message string, err error, fields ...Field)
	Debug(message string, fields ...Field)

	With(fields ...Field) Logger
}

// Field represents a log field
type Field struct {
	Key   string
	Value interface{}
}

// EventHandler defines the interface for handling events
type EventHandler func(ctx context.Context, event *Event) error