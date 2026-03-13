package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
)

// AuditRepository defines the interface for audit log data access
type AuditRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, auditLog *entities.AuditLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.AuditLog, error)

	// Query operations
	GetByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*entities.AuditLog, error)
	GetByUsername(ctx context.Context, username string, limit int) ([]*entities.AuditLog, error)
	GetByAction(ctx context.Context, action string, limit int) ([]*entities.AuditLog, error)
	GetByEntityType(ctx context.Context, entityType string, limit int) ([]*entities.AuditLog, error)
	GetByDateRange(ctx context.Context, startDate, endDate time.Time, limit int) ([]*entities.AuditLog, error)

	// Security queries
	GetFailedLogins(ctx context.Context, limit int) ([]*entities.AuditLog, error)
	GetFailedLoginsByUsername(ctx context.Context, username string, limit int) ([]*entities.AuditLog, error)
	GetRecentFailedLogins(ctx context.Context, since time.Time, limit int) ([]*entities.AuditLog, error)

	// Statistics
	CountByAction(ctx context.Context, action string, date time.Time) (int, error)
	CountByUser(ctx context.Context, userID uuid.UUID, date time.Time) (int, error)
	CountFailedLogins(ctx context.Context, date time.Time) (int, error)

	// Search
	Search(ctx context.Context, query string, limit int) ([]*entities.AuditLog, error)

	// Cleanup
	DeleteOldLogs(ctx context.Context, olderThan time.Time) (int, error)
}