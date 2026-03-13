package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
)

// DeviceRepository defines the interface for device data access
type DeviceRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, device *entities.DeviceInfo) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.DeviceInfo, error)
	GetByDeviceName(ctx context.Context, deviceName string) (*entities.DeviceInfo, error)
	Update(ctx context.Context, device *entities.DeviceInfo) error
	Delete(ctx context.Context, id uuid.UUID) error

	// Query operations
	GetActiveDevices(ctx context.Context) ([]*entities.DeviceInfo, error)
	GetInactiveDevices(ctx context.Context) ([]*entities.DeviceInfo, error)
	GetByLocation(ctx context.Context, location string) ([]*entities.DeviceInfo, error)

	// Existence checks
	DeviceNameExists(ctx context.Context, deviceName string) (bool, error)
	APIKeyExists(ctx context.Context, apiKey string) (bool, error)
}

// WeighingSessionRepository defines the interface for weighing session data access
type WeighingSessionRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, session *entities.WeighingSession) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.WeighingSession, error)
	Update(ctx context.Context, session *entities.WeighingSession) error
	Delete(ctx context.Context, id uuid.UUID) error

	// Query operations
	GetActiveSessionByOperator(ctx context.Context, operatorID uuid.UUID, deviceID string) (*entities.WeighingSession, error)
	GetSessionsByOperator(ctx context.Context, operatorID uuid.UUID, limit int) ([]*entities.WeighingSession, error)
	GetSessionsByDate(ctx context.Context, date time.Time, limit int) ([]*entities.WeighingSession, error)
	GetRecentSessions(ctx context.Context, limit int) ([]*entities.WeighingSession, error)

	// Statistics
	CountSessionsByOperator(ctx context.Context, operatorID uuid.UUID, date time.Time) (int, error)
	GetTotalWeighingsByOperator(ctx context.Context, operatorID uuid.UUID, date time.Time) (int, error)
}