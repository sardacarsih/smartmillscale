package persistence

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/models"
)

// SyncQueueRepositoryImpl implements the SyncQueueRepository interface
type SyncQueueRepositoryImpl struct {
	BaseRepository
}

// NewSyncQueueRepository creates a new SyncQueueRepository implementation
func NewSyncQueueRepository(db *gorm.DB) repositories.SyncQueueRepository {
	return &SyncQueueRepositoryImpl{
		BaseRepository: BaseRepository{db: db},
	}
}

// Create creates a new sync queue item
func (r *SyncQueueRepositoryImpl) Create(ctx context.Context, queue *entities.SyncQueue) error {
	if queue == nil {
		return errors.New("queue cannot be nil")
	}

	model := &models.SyncQueueModel{
		ID:            queue.ID,
		EntityType:    queue.EntityType,
		EntityID:      queue.EntityID,
		PayloadJSON:   queue.PayloadJSON,
		Status:        string(queue.Status),
		RetryCount:    queue.RetryCount,
		MaxRetries:    queue.MaxRetries,
		LastError:     queue.LastError,
		LastRetryAt:   queue.LastRetryAt,
		IdempotencyKey: queue.IdempotencyKey,
	}

	return r.WithContext(ctx).Create(model).Error
}

// GetByID retrieves a sync queue item by ID
func (r *SyncQueueRepositoryImpl) GetByID(ctx context.Context, id uuid.UUID) (*entities.SyncQueue, error) {
	var model models.SyncQueueModel
	err := r.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("sync queue item not found")
		}
		return nil, err
	}
	return r.modelToEntity(&model), nil
}

// Update updates a sync queue item
func (r *SyncQueueRepositoryImpl) Update(ctx context.Context, queue *entities.SyncQueue) error {
	if queue == nil {
		return errors.New("queue cannot be nil")
	}

	updates := map[string]interface{}{
		"status":       string(queue.Status),
		"retry_count":  queue.RetryCount,
		"max_retries":  queue.MaxRetries,
		"last_error":   queue.LastError,
		"last_retry_at": queue.LastRetryAt,
		"updated_at":   time.Now(),
	}

	return r.WithContext(ctx).Model(&models.SyncQueueModel{}).Where("id = ?", queue.ID).Updates(updates).Error
}

// Delete deletes a sync queue item
func (r *SyncQueueRepositoryImpl) Delete(ctx context.Context, id uuid.UUID) error {
	return r.WithContext(ctx).Where("id = ?", id).Delete(&models.SyncQueueModel{}).Error
}

// GetPendingItems retrieves pending sync items
func (r *SyncQueueRepositoryImpl) GetPendingItems(ctx context.Context, limit int) ([]*entities.SyncQueue, error) {
	var models []models.SyncQueueModel
	query := r.WithContext(ctx).
		Where("status = ?", string(entities.QueueStatusPending)).
		Order("created_at ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&models).Error
	if err != nil {
		return nil, err
	}

	return r.modelsToEntities(models), nil
}

// GetProcessingItems retrieves processing sync items
func (r *SyncQueueRepositoryImpl) GetProcessingItems(ctx context.Context, limit int) ([]*entities.SyncQueue, error) {
	var models []models.SyncQueueModel
	query := r.WithContext(ctx).
		Where("status = ?", string(entities.QueueStatusProcessing)).
		Order("updated_at ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&models).Error
	if err != nil {
		return nil, err
	}

	return r.modelsToEntities(models), nil
}

// GetFailedItems retrieves failed sync items
func (r *SyncQueueRepositoryImpl) GetFailedItems(ctx context.Context, limit int) ([]*entities.SyncQueue, error) {
	var models []models.SyncQueueModel
	query := r.WithContext(ctx).
		Where("status = ?", string(entities.QueueStatusFailed)).
		Order("updated_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&models).Error
	if err != nil {
		return nil, err
	}

	return r.modelsToEntities(models), nil
}

// GetItemsToRetry retrieves items that can be retried
func (r *SyncQueueRepositoryImpl) GetItemsToRetry(ctx context.Context, limit int) ([]*entities.SyncQueue, error) {
	var models []models.SyncQueueModel
	query := r.WithContext(ctx).
		Where("status = ? AND retry_count < max_retries", string(entities.QueueStatusFailed)).
		Order("updated_at ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&models).Error
	if err != nil {
		return nil, err
	}

	return r.modelsToEntities(models), nil
}

// CreateBatch creates multiple sync queue items
func (r *SyncQueueRepositoryImpl) CreateBatch(ctx context.Context, items []*entities.SyncQueue) error {
	if len(items) == 0 {
		return nil
	}

	queueModels := make([]*models.SyncQueueModel, len(items))
	for i, item := range items {
		queueModels[i] = &models.SyncQueueModel{
			ID:            item.ID,
			EntityType:    item.EntityType,
			EntityID:      item.EntityID,
			PayloadJSON:   item.PayloadJSON,
			Status:        string(item.Status),
			RetryCount:    item.RetryCount,
			MaxRetries:    item.MaxRetries,
			LastError:     item.LastError,
			LastRetryAt:   item.LastRetryAt,
			IdempotencyKey: item.IdempotencyKey,
		}
	}

	return r.Transaction(ctx, func(tx *gorm.DB) error {
		return tx.CreateInBatches(queueModels, 100).Error
	})
}

// MarkAsProcessing marks an item as processing
func (r *SyncQueueRepositoryImpl) MarkAsProcessing(ctx context.Context, id uuid.UUID) error {
	updates := map[string]interface{}{
		"status":     string(entities.QueueStatusProcessing),
		"updated_at": time.Now(),
	}
	return r.WithContext(ctx).Model(&models.SyncQueueModel{}).Where("id = ?", id).Updates(updates).Error
}

// MarkAsSuccess marks an item as successfully processed
func (r *SyncQueueRepositoryImpl) MarkAsSuccess(ctx context.Context, id uuid.UUID) error {
	updates := map[string]interface{}{
		"status":     string(entities.QueueStatusSuccess),
		"updated_at": time.Now(),
	}
	return r.WithContext(ctx).Model(&models.SyncQueueModel{}).Where("id = ?", id).Updates(updates).Error
}

// MarkAsFailed marks an item as failed with retry
func (r *SyncQueueRepositoryImpl) MarkAsFailed(ctx context.Context, id uuid.UUID, err error) error {
	var errorMsg *string
	if err != nil {
		msg := err.Error()
		errorMsg = &msg
	}

	updates := map[string]interface{}{
		"status":       string(entities.QueueStatusFailed),
		"retry_count":  gorm.Expr("retry_count + 1"),
		"last_error":   errorMsg,
		"last_retry_at": time.Now(),
		"updated_at":   time.Now(),
	}
	return r.WithContext(ctx).Model(&models.SyncQueueModel{}).Where("id = ?", id).Updates(updates).Error
}

// MarkAsAbandoned marks an item as abandoned
func (r *SyncQueueRepositoryImpl) MarkAsAbandoned(ctx context.Context, id uuid.UUID) error {
	updates := map[string]interface{}{
		"status":     string(entities.QueueStatusAbandoned),
		"updated_at": time.Now(),
	}
	return r.WithContext(ctx).Model(&models.SyncQueueModel{}).Where("id = ?", id).Updates(updates).Error
}

// GetByEntity retrieves sync items by entity
func (r *SyncQueueRepositoryImpl) GetByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*entities.SyncQueue, error) {
	var models []models.SyncQueueModel
	err := r.WithContext(ctx).
		Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("created_at DESC").
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	return r.modelsToEntities(models), nil
}

// GetByStatus retrieves sync items by status
func (r *SyncQueueRepositoryImpl) GetByStatus(ctx context.Context, status entities.QueueStatus, limit int) ([]*entities.SyncQueue, error) {
	var models []models.SyncQueueModel
	query := r.WithContext(ctx).
		Where("status = ?", string(status)).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&models).Error
	if err != nil {
		return nil, err
	}
	return r.modelsToEntities(models), nil
}

// GetByIdempotencyKey retrieves a sync item by idempotency key
func (r *SyncQueueRepositoryImpl) GetByIdempotencyKey(ctx context.Context, key string) (*entities.SyncQueue, error) {
	var model models.SyncQueueModel
	err := r.WithContext(ctx).Where("idempotency_key = ?", key).First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("sync queue item not found")
		}
		return nil, err
	}
	return r.modelToEntity(&model), nil
}

// CountByStatus counts sync items by status
func (r *SyncQueueRepositoryImpl) CountByStatus(ctx context.Context, status entities.QueueStatus) (int, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.SyncQueueModel{}).
		Where("status = ?", string(status)).
		Count(&count).Error
	return int(count), err
}

// CountPendingItems counts pending sync items
func (r *SyncQueueRepositoryImpl) CountPendingItems(ctx context.Context) (int, error) {
	return r.CountByStatus(ctx, entities.QueueStatusPending)
}

// CountFailedItems counts failed sync items
func (r *SyncQueueRepositoryImpl) CountFailedItems(ctx context.Context) (int, error) {
	return r.CountByStatus(ctx, entities.QueueStatusFailed)
}

// DeleteCompletedItems deletes completed items older than specified days
func (r *SyncQueueRepositoryImpl) DeleteCompletedItems(ctx context.Context, olderThanDays int) (int, error) {
	cutoff := time.Now().AddDate(0, 0, -olderThanDays)

	var rowsAffected int64
	err := r.WithContext(ctx).
		Where("status IN ? AND updated_at < ?",
			[]string{string(entities.QueueStatusSuccess), string(entities.QueueStatusAbandoned)},
			cutoff).
		Delete(&models.SyncQueueModel{}).
		Count(&rowsAffected).Error

	return int(rowsAffected), err
}

// DeleteAbandonedItems deletes abandoned items older than specified days
func (r *SyncQueueRepositoryImpl) DeleteAbandonedItems(ctx context.Context, olderThanDays int) (int, error) {
	cutoff := time.Now().AddDate(0, 0, -olderThanDays)

	var rowsAffected int64
	err := r.WithContext(ctx).
		Where("status = ? AND updated_at < ?", string(entities.QueueStatusAbandoned), cutoff).
		Delete(&models.SyncQueueModel{}).
		Count(&rowsAffected).Error

	return int(rowsAffected), err
}

// Helper methods for model-to-entity conversion
func (r *SyncQueueRepositoryImpl) modelToEntity(model *models.SyncQueueModel) *entities.SyncQueue {
	return &entities.SyncQueue{
		ID:            model.ID,
		EntityType:    model.EntityType,
		EntityID:      model.EntityID,
		PayloadJSON:   model.PayloadJSON,
		Status:        entities.QueueStatus(model.Status),
		RetryCount:    model.RetryCount,
		MaxRetries:    model.MaxRetries,
		LastError:     model.LastError,
		LastRetryAt:   model.LastRetryAt,
		CreatedAt:     model.CreatedAt,
		UpdatedAt:     model.UpdatedAt,
		IdempotencyKey: model.IdempotencyKey,
	}
}

func (r *SyncQueueRepositoryImpl) modelsToEntities(models []models.SyncQueueModel) []*entities.SyncQueue {
	if len(models) == 0 {
		return []*entities.SyncQueue{}
	}

	entities := make([]*entities.SyncQueue, len(models))
	for i, model := range models {
		entities[i] = r.modelToEntity(&model)
	}
	return entities
}