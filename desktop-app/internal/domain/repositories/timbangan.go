package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
)

// TimbanganRepository defines the interface for timbangan data access
type TimbanganRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, timbangan *entities.Timbangan) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.Timbangan, error)
	Update(ctx context.Context, timbangan *entities.Timbangan) error
	Delete(ctx context.Context, id uuid.UUID) error

	// Business queries
	GetByNomorKendaraanAndTanggal(ctx context.Context, nomorKendaraan string, tanggal time.Time) (*entities.Timbangan, error)
	GetPendingWeighings(ctx context.Context, limit int) ([]*entities.Timbangan, error)
	GetByDateRange(ctx context.Context, startDate, endDate time.Time, limit int) ([]*entities.Timbangan, error)
	GetByOperator(ctx context.Context, operatorID uuid.UUID, limit int) ([]*entities.Timbangan, error)
	GetRecentWeighings(ctx context.Context, limit int) ([]*entities.Timbangan, error)

	// Sync operations
	GetPendingSync(ctx context.Context, limit int) ([]*entities.Timbangan, error)
	GetFailedSync(ctx context.Context, limit int) ([]*entities.Timbangan, error)
	MarkAsSynced(ctx context.Context, id uuid.UUID, serverID uuid.UUID) error
	MarkAsSyncFailed(ctx context.Context, id uuid.UUID, err error) error

	// Search and filtering
	Search(ctx context.Context, query string, limit int) ([]*entities.Timbangan, error)
	GetByVehicleType(ctx context.Context, vehicleType string, limit int) ([]*entities.Timbangan, error)
	GetByWeighingType(ctx context.Context, weighingType entities.WeighingType, limit int) ([]*entities.Timbangan, error)

	// Statistics
	CountByDate(ctx context.Context, date time.Time) (int, error)
	CountByDateRange(ctx context.Context, startDate, endDate time.Time) (int, error)
	CountPendingSync(ctx context.Context) (int, error)
	GetTotalWeightByDate(ctx context.Context, date time.Time) (int, error)

	// Batch operations
	CreateBatch(ctx context.Context, timbangans []*entities.Timbangan) error
	UpdateBatch(ctx context.Context, timbangans []*entities.Timbangan) error
}