package repositories

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
)

// SyncQueueRepository defines the interface for sync queue data access
type SyncQueueRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, queue *entities.SyncQueue) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.SyncQueue, error)
	Update(ctx context.Context, queue *entities.SyncQueue) error
	Delete(ctx context.Context, id uuid.UUID) error

	// Queue management
	GetPendingItems(ctx context.Context, limit int) ([]*entities.SyncQueue, error)
	GetProcessingItems(ctx context.Context, limit int) ([]*entities.SyncQueue, error)
	GetFailedItems(ctx context.Context, limit int) ([]*entities.SyncQueue, error)
	GetItemsToRetry(ctx context.Context, limit int) ([]*entities.SyncQueue, error)

	// Batch operations
	CreateBatch(ctx context.Context, items []*entities.SyncQueue) error
	MarkAsProcessing(ctx context.Context, id uuid.UUID) error
	MarkAsSuccess(ctx context.Context, id uuid.UUID) error
	MarkAsFailed(ctx context.Context, id uuid.UUID, err error) error
	MarkAsAbandoned(ctx context.Context, id uuid.UUID) error

	// Query operations
	GetByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*entities.SyncQueue, error)
	GetByStatus(ctx context.Context, status entities.QueueStatus, limit int) ([]*entities.SyncQueue, error)
	 GetByIdempotencyKey(ctx context.Context, key string) (*entities.SyncQueue, error)

	// Statistics
	CountByStatus(ctx context.Context, status entities.QueueStatus) (int, error)
	CountPendingItems(ctx context.Context) (int, error)
	CountFailedItems(ctx context.Context) (int, error)

	// Cleanup
	DeleteCompletedItems(ctx context.Context, olderThanDays int) (int, error)
	DeleteAbandonedItems(ctx context.Context, olderThanDays int) (int, error)
}

// SyncHistoryRepository defines the interface for sync history data access
type SyncHistoryRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, history *entities.SyncHistory) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.SyncHistory, error)

	// Query operations
	GetByEntity(ctx context.Context, entityType string, entityID uuid.UUID, limit int) ([]*entities.SyncHistory, error)
	GetByQueue(ctx context.Context, queueID uuid.UUID, limit int) ([]*entities.SyncHistory, error)
	GetByStatus(ctx context.Context, status string, limit int) ([]*entities.SyncHistory, error)
	GetRecentHistory(ctx context.Context, limit int) ([]*entities.SyncHistory, error)

	// Statistics
	CountSuccessfulSyncs(ctx context.Context) (int, error)
	CountFailedSyncs(ctx context.Context) (int, error)
	GetSuccessRate(ctx context.Context, dateRange string) (float64, error)
	GetAverageSyncDuration(ctx context.Context) (int, error)

	// Cleanup
	DeleteOldHistory(ctx context.Context, olderThanDays int) (int, error)
}