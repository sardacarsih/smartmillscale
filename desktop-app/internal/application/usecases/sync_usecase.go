package usecases

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/sync"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

var (
	ErrSyncAlreadyInProgress = errors.New("sync already in progress")
	ErrServerUnreachable     = errors.New("server unreachable")
	ErrInvalidConfig         = errors.New("invalid sync configuration")
)

// SyncUseCase handles synchronization operations
type SyncUseCase struct {
	timbanganRepo    repositories.TimbanganRepository
	syncQueueRepo    repositories.SyncQueueRepository
	syncHistoryRepo  repositories.SyncHistoryRepository
	deviceRepo       repositories.DeviceRepository
	clientFactory    *sync.ClientFactory
	config           *dto.SyncConfig
	syncInProgress   bool
	lastSyncAt       *time.Time
}

// NewSyncUseCase creates a new sync use case
func NewSyncUseCase(
	timbanganRepo repositories.TimbanganRepository,
	syncQueueRepo repositories.SyncQueueRepository,
	syncHistoryRepo repositories.SyncHistoryRepository,
	deviceRepo repositories.DeviceRepository,
	clientFactory *sync.ClientFactory,
) *SyncUseCase {
	return &SyncUseCase{
		timbanganRepo:   timbanganRepo,
		syncQueueRepo:   syncQueueRepo,
		syncHistoryRepo: syncHistoryRepo,
		deviceRepo:      deviceRepo,
		clientFactory:   clientFactory,
		config:          getDefaultSyncConfig(),
	}
}

// TriggerManualSync triggers a manual synchronization
func (uc *SyncUseCase) TriggerManualSync(ctx context.Context, req *dto.SyncRequest) (*dto.SyncResponse, error) {
	if uc.syncInProgress && !req.ForceSync {
		return nil, ErrSyncAlreadyInProgress
	}

	startTime := time.Now()
	uc.syncInProgress = true
	defer func() {
		uc.syncInProgress = false
		now := time.Now()
		uc.lastSyncAt = &now
	}()

	response := &dto.SyncResponse{
		Success: false,
		Message: "",
	}

	// Get pending items to sync
	var items []*entities.SyncQueue
	var err error

	if len(req.EntityIDs) > 0 {
		// Sync specific items
		items, err = uc.getSpecificItems(ctx, req.EntityIDs)
	} else {
		// Sync all pending items
		items, err = uc.syncQueueRepo.GetPendingItems(ctx, req.BatchSize)
	}

	if err != nil {
		response.Message = fmt.Sprintf("Failed to get pending items: %v", err)
		return response, err
	}

	response.TotalItems = len(items)
	if response.TotalItems == 0 {
		response.Success = true
		response.Message = "No items to sync"
		response.RemainingItems = 0
		return response, nil
	}

	// Process items in batches
	batchSize := req.BatchSize
	if batchSize <= 0 {
		batchSize = uc.config.BatchSize
	}

	successCount := 0
	failureCount := 0

	for i := 0; i < len(items); i += batchSize {
		end := i + batchSize
		if end > len(items) {
			end = len(items)
		}

		batch := items[i:end]
		batchSuccess, batchFailure := uc.processBatch(ctx, batch)

		successCount += batchSuccess
		failureCount += batchFailure
	}

	// Build response
	response.ProcessedItems = successCount + failureCount
	response.SuccessCount = successCount
	response.FailureCount = failureCount
	response.RemainingItems, _ = uc.syncQueueRepo.CountPendingItems(ctx)
	response.Duration = time.Since(startTime).Milliseconds()
	response.Success = failureCount == 0

	if response.Success {
		response.Message = fmt.Sprintf("Successfully synced %d items", successCount)
	} else {
		response.Message = fmt.Sprintf("Partial success: %d succeeded, %d failed", successCount, failureCount)
	}

	return response, nil
}

// GetSyncStatus returns current sync status
func (uc *SyncUseCase) GetSyncStatus(ctx context.Context) (*dto.SyncStatusResponse, error) {
	pendingCount, _ := uc.syncQueueRepo.CountPendingItems(ctx)
	processingCount, _ := uc.syncQueueRepo.CountByStatus(ctx, entities.QueueStatusProcessing)
	failedCount, _ := uc.syncQueueRepo.CountFailedItems(ctx)

	return &dto.SyncStatusResponse{
		IsOnline:        uc.isServerReachable(ctx),
		LastSyncAt:      uc.lastSyncAt,
		NextSyncAt:      uc.calculateNextSyncTime(),
		PendingCount:    pendingCount,
		ProcessingCount: processingCount,
		FailedCount:     failedCount,
		SuccessCount:    uc.getSuccessCount(ctx),
		TotalSynced:     uc.getTotalSynced(ctx),
		SyncInProgress:  uc.syncInProgress,
		AutoSyncEnabled: uc.config.AutoSyncEnabled,
		SyncInterval:    uc.config.SyncInterval,
	}, nil
}

// GetSyncQueue returns sync queue items
func (uc *SyncUseCase) GetSyncQueue(ctx context.Context, status string, limit int) ([]*dto.SyncQueueItem, error) {
	var items []*entities.SyncQueue
	var err error

	if status != "" {
		queueStatus := entities.QueueStatus(status)
		items, err = uc.syncQueueRepo.GetByStatus(ctx, queueStatus, limit)
	} else {
		items, err = uc.syncQueueRepo.GetPendingItems(ctx, limit)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get sync queue: %w", err)
	}

	responses := make([]*dto.SyncQueueItem, len(items))
	for i, item := range items {
		responses[i] = &dto.SyncQueueItem{
			ID:            item.ID,
			EntityType:    item.EntityType,
			EntityID:      item.EntityID,
			Status:        string(item.Status),
			RetryCount:    item.RetryCount,
			MaxRetries:    item.MaxRetries,
			LastError:     item.LastError,
			LastRetryAt:   item.LastRetryAt,
			CreatedAt:     item.CreatedAt,
			UpdatedAt:     item.UpdatedAt,
		}
	}

	return responses, nil
}

// GetSyncHistory returns sync history
func (uc *SyncUseCase) GetSyncHistory(ctx context.Context, limit int) ([]*dto.SyncHistoryItem, error) {
	histories, err := uc.syncHistoryRepo.GetRecentHistory(ctx, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get sync history: %w", err)
	}

	responses := make([]*dto.SyncHistoryItem, len(histories))
	for i, history := range histories {
		responses[i] = &dto.SyncHistoryItem{
			ID:            history.ID,
			QueueID:       history.QueueID,
			EntityType:    history.EntityType,
			EntityID:      history.EntityID,
			AttemptNumber: history.AttemptNumber,
			Status:        history.Status,
			ErrorMessage:  history.ErrorMessage,
			DurationMs:    history.DurationMs,
			AttemptedAt:   history.AttemptedAt,
		}
	}

	return responses, nil
}

// GetSyncStatistics returns sync statistics
func (uc *SyncUseCase) GetSyncStatistics(ctx context.Context) (*dto.SyncStatisticsResponse, error) {
	successCount, _ := uc.syncHistoryRepo.CountSuccessfulSyncs(ctx)
	failureCount, _ := uc.syncHistoryRepo.CountFailedSyncs(ctx)
	pendingItems, _ := uc.syncQueueRepo.CountPendingItems(ctx)
	processingItems, _ := uc.syncQueueRepo.CountByStatus(ctx, entities.QueueStatusProcessing)
	failedItems, _ := uc.syncQueueRepo.CountFailedItems(ctx)

	totalAttempts := successCount + failureCount
	successRate := 0.0
	if totalAttempts > 0 {
		successRate = float64(successCount) / float64(totalAttempts) * 100
	}

	avgDuration, _ := uc.syncHistoryRepo.GetAverageSyncDuration(ctx)

	return &dto.SyncStatisticsResponse{
		TotalAttempts:   totalAttempts,
		SuccessfulSyncs: successCount,
		FailedSyncs:     failureCount,
		SuccessRate:     successRate,
		AverageDuration: avgDuration,
		PendingItems:    pendingItems,
		ProcessingItems: processingItems,
		FailedItems:     failedItems,
	}, nil
}

// QueueForSync queues an entity for synchronization
func (uc *SyncUseCase) QueueForSync(ctx context.Context, entityType string, entityID uuid.UUID, payload interface{}) error {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Check if already queued
	existing, err := uc.syncQueueRepo.GetByEntity(ctx, entityType, entityID)
	if err == nil && len(existing) > 0 {
		// Check if any are still pending
		for _, item := range existing {
			if item.IsPending() {
				return nil // Already queued
			}
		}
	}

	// Create new queue item
	queueItem := entities.NewSyncQueue(entityType, entityID, string(payloadJSON))
	return uc.syncQueueRepo.Create(ctx, queueItem)
}

// RetryFailedSyncs retries failed sync items
func (uc *SyncUseCase) RetryFailedSyncs(ctx context.Context) (*dto.SyncResponse, error) {
	if uc.syncInProgress {
		return nil, ErrSyncAlreadyInProgress
	}

	// Get items to retry
	items, err := uc.syncQueueRepo.GetItemsToRetry(ctx, 100)
	if err != nil {
		return nil, fmt.Errorf("failed to get items to retry: %w", err)
	}

	if len(items) == 0 {
		return &dto.SyncResponse{
			Success:    true,
			Message:    "No items to retry",
			TotalItems: 0,
		}, nil
	}

	// Reset items to pending
	for _, item := range items {
		item.Status = entities.QueueStatusPending
		if err := uc.syncQueueRepo.Update(ctx, item); err != nil {
			fmt.Printf("Warning: failed to reset item %s: %v\n", item.ID, err)
		}
	}

	// Trigger sync
	return uc.TriggerManualSync(ctx, &dto.SyncRequest{BatchSize: len(items)})
}

// UpdateSyncConfig updates sync configuration
func (uc *SyncUseCase) UpdateSyncConfig(config *dto.SyncConfig) {
	uc.config = config
}

// GetSyncConfig returns current sync configuration
func (uc *SyncUseCase) GetSyncConfig() *dto.SyncConfig {
	return uc.config
}

// HealthCheck performs sync system health check
func (uc *SyncUseCase) HealthCheck(ctx context.Context) (*dto.SyncHealthCheckResponse, error) {
	response := &dto.SyncHealthCheckResponse{
		IsHealthy:      true,
		LastCheckAt:    time.Now(),
		DatabaseStatus: "healthy",
	}

	// Check server reachability
	response.ServerReachable = uc.isServerReachable(ctx)
	if !response.ServerReachable {
		response.IsHealthy = false
		response.ErrorMessages = append(response.ErrorMessages, "Server unreachable")
	}

	// Check queue size
	pendingCount, _ := uc.syncQueueRepo.CountPendingItems(ctx)
	response.QueueSize = pendingCount

	if pendingCount > 1000 {
		response.IsHealthy = false
		response.ErrorMessages = append(response.ErrorMessages, "Queue size too large")
	}

	return response, nil
}

// Private helper methods

func (uc *SyncUseCase) processBatch(ctx context.Context, items []*entities.SyncQueue) (successCount, failureCount int) {
	for _, item := range items {
		// Mark as processing
		if err := uc.syncQueueRepo.MarkAsProcessing(ctx, item.ID); err != nil {
			fmt.Printf("Warning: failed to mark item %s as processing: %v\n", item.ID, err)
			continue
		}

		// Process item
		startTime := time.Now()
		success := uc.processItem(ctx, item)
		duration := time.Since(startTime).Milliseconds()

		// Create history record
		status := "SUCCESS"
		if !success {
			status = "FAILED"
			failureCount++
		} else {
			successCount++
		}

		history := entities.NewSyncHistory(item.EntityType, item.EntityID, 1, status).
			WithDuration(int(duration)).
			WithQueue(&item.ID)

		if !success {
			history.WithError("Sync failed")
		}

		uc.syncHistoryRepo.Create(ctx, history)
	}

	return successCount, failureCount
}

func (uc *SyncUseCase) processItem(ctx context.Context, item *entities.SyncQueue) bool {
	// Get active GraphQL client from factory
	client, err := uc.clientFactory.GetActiveClient(ctx)
	if err != nil {
		log.Printf("Failed to get sync client for item %s: %v", item.EntityID, err)
		return false
	}

	// Parse payload JSON to TimbanganData
	var data types.TimbanganData
	if err := json.Unmarshal([]byte(item.PayloadJSON), &data); err != nil {
		log.Printf("Failed to unmarshal payload for item %s: %v", item.EntityID, err)
		return false
	}

	// Execute sync with timeout
	syncCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	result, err := client.SyncSingleRecord(syncCtx, data)
	if err != nil {
		log.Printf("Sync failed for item %s (entity: %s): %v", item.ID, item.EntityID, err)
		return false
	}

	// Check if sync was successful
	if result.Status != "SUCCESS" {
		errorMsg := "Unknown error"
		if result.Error != nil {
			errorMsg = *result.Error
		}
		log.Printf("Sync rejected for item %s: %s", item.EntityID, errorMsg)
		return false
	}

	// Update timbangan record with idPusat if available
	if result.IDPusat != nil {
		if err := uc.updateTimbanganWithCentralID(ctx, item.EntityID, *result.IDPusat); err != nil {
			log.Printf("Warning: Failed to update timbangan with idPusat for %s: %v", item.EntityID, err)
			// Don't fail the sync if update fails - the sync itself was successful
		}
	}

	log.Printf("Successfully synced item %s (entity: %s, idPusat: %v)", item.ID, item.EntityID, result.IDPusat)
	return true
}

// updateTimbanganWithCentralID updates the timbangan record with the central ID from server
func (uc *SyncUseCase) updateTimbanganWithCentralID(ctx context.Context, entityID uuid.UUID, idPusat uuid.UUID) error {
	// Fetch the timbangan record
	timbangan, err := uc.timbanganRepo.GetByID(ctx, entityID)
	if err != nil {
		return fmt.Errorf("failed to find timbangan: %w", err)
	}

	// Update idPusat
	timbangan.IDPusat = &idPusat

	// Save the updated record
	if err := uc.timbanganRepo.Update(ctx, timbangan); err != nil {
		return fmt.Errorf("failed to update timbangan: %w", err)
	}

	return nil
}

func (uc *SyncUseCase) getSpecificItems(ctx context.Context, entityIDs []uuid.UUID) ([]*entities.SyncQueue, error) {
	var items []*entities.SyncQueue
	for _, id := range entityIDs {
		item, err := uc.syncQueueRepo.GetByID(ctx, id)
		if err != nil {
			continue
		}
		items = append(items, item)
	}
	return items, nil
}

func (uc *SyncUseCase) isServerReachable(ctx context.Context) bool {
	// Get active GraphQL client from factory
	client, err := uc.clientFactory.GetActiveClient(ctx)
	if err != nil {
		log.Printf("Failed to get sync client for health check: %v", err)
		return false
	}

	// Perform health check with timeout
	checkCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	err = client.HealthCheck(checkCtx)
	if err != nil {
		log.Printf("Server health check failed: %v", err)
		return false
	}

	return true
}

func (uc *SyncUseCase) calculateNextSyncTime() *time.Time {
	if !uc.config.AutoSyncEnabled || uc.lastSyncAt == nil {
		return nil
	}

	nextSync := uc.lastSyncAt.Add(time.Duration(uc.config.SyncInterval) * time.Second)
	return &nextSync
}

func (uc *SyncUseCase) getSuccessCount(ctx context.Context) int {
	count, _ := uc.syncHistoryRepo.CountSuccessfulSyncs(ctx)
	return count
}

func (uc *SyncUseCase) getTotalSynced(ctx context.Context) int {
	// This would typically be tracked separately
	// For now, return success count
	return uc.getSuccessCount(ctx)
}

func getDefaultSyncConfig() *dto.SyncConfig {
	return &dto.SyncConfig{
		AutoSyncEnabled: true,
		SyncInterval:    300, // 5 minutes
		MaxRetries:      3,
		RetryDelay:      60,  // 1 minute
		BatchSize:       50,
		Timeout:         30,  // 30 seconds
		OfflineMode:     false,
		LastSyncSuccess: false,
	}
}