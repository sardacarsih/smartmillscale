package sync

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

// Worker handles background synchronization with exponential backoff
type Worker struct {
	db             *gorm.DB
	client         *GraphQLClient
	interval       time.Duration
	batchSize      int
	maxRetries     int
	stopCh         chan struct{}
	wg             sync.WaitGroup
	serverHealthy  bool
	healthCheckURL string
	mu             sync.RWMutex
	shutdownCtx    context.Context    // Parent context for graceful shutdown
	shutdownCancel context.CancelFunc // Cancel function for shutdown context
}

// Config holds worker configuration
type Config struct {
	ServerURL      string
	DeviceID       uuid.UUID
	APIKey         string
	SyncInterval   time.Duration
	BatchSize      int
	MaxRetries     int
}

// NewWorker creates a new sync worker
func NewWorker(db *gorm.DB, config Config) *Worker {
	client := NewGraphQLClient(config.ServerURL, config.DeviceID, config.APIKey)
	shutdownCtx, shutdownCancel := context.WithCancel(context.Background())

	return &Worker{
		db:             db,
		client:         client,
		interval:       config.SyncInterval,
		batchSize:      config.BatchSize,
		maxRetries:     config.MaxRetries,
		stopCh:         make(chan struct{}),
		serverHealthy:  true,
		healthCheckURL: config.ServerURL,
		shutdownCtx:    shutdownCtx,
		shutdownCancel: shutdownCancel,
	}
}

// Start begins the sync worker
func (w *Worker) Start() {
	log.Println("Starting sync worker...")

	// Start main sync loop
	w.wg.Add(1)
	go w.syncLoop()

	// Start health check loop
	w.wg.Add(1)
	go w.healthCheckLoop()

	log.Println("Sync worker started successfully")
}

// Stop gracefully stops the sync worker
func (w *Worker) Stop() {
	log.Println("Stopping sync worker...")
	w.shutdownCancel() // Cancel all derived contexts
	close(w.stopCh)
	w.wg.Wait()
	log.Println("Sync worker stopped")
}

// syncLoop is the main sync processing loop
func (w *Worker) syncLoop() {
	defer w.wg.Done()

	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	// Process immediately on start
	w.processQueue()

	for {
		select {
		case <-ticker.C:
			w.processQueue()
		case <-w.stopCh:
			return
		}
	}
}

// healthCheckLoop periodically checks server health
func (w *Worker) healthCheckLoop() {
	defer w.wg.Done()

	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.checkServerHealth()
		case <-w.stopCh:
			return
		}
	}
}

// checkServerHealth checks if the server is reachable
func (w *Worker) checkServerHealth() {
	ctx, cancel := context.WithTimeout(w.shutdownCtx, 5*time.Second)
	defer cancel()

	err := w.client.HealthCheck(ctx)

	w.mu.Lock()
	defer w.mu.Unlock()

	if err != nil {
		w.serverHealthy = false
		log.Printf("Server health check failed: %v", err)
	} else {
		w.serverHealthy = true
	}
}

// isServerHealthy returns the current server health status
func (w *Worker) isServerHealthy() bool {
	w.mu.RLock()
	defer w.mu.RUnlock()
	return w.serverHealthy
}

// processQueue processes pending items in the sync queue
func (w *Worker) processQueue() {
	// Skip if server is unhealthy
	if !w.isServerHealthy() {
		log.Println("Server unhealthy, skipping sync cycle")
		return
	}

	ctx, cancel := context.WithTimeout(w.shutdownCtx, 5*time.Minute)
	defer cancel()

	// Fetch pending items with locking (SELECT FOR UPDATE)
	var items []database.SyncQueue

	err := w.db.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("status IN ?", []string{
			string(types.QueueStatusPending),
			string(types.QueueStatusFailed),
		}).
		Where("retry_count < max_retries").
		Order("created_at ASC").
		Limit(w.batchSize).
		Find(&items).Error

	if err != nil {
		log.Printf("Failed to fetch queue items: %v", err)
		return
	}

	if len(items) == 0 {
		return
	}

	log.Printf("Processing %d pending sync items", len(items))

	// Process each item
	for _, item := range items {
		// Check if we should retry based on backoff
		if !w.shouldRetry(item) {
			continue
		}

		err := w.syncItem(ctx, item)
		if err != nil {
			w.handleSyncFailure(item, err)
		} else {
			w.handleSyncSuccess(item)
		}
	}
}

// shouldRetry checks if an item should be retried based on exponential backoff
func (w *Worker) shouldRetry(item database.SyncQueue) bool {
	if item.RetryCount == 0 {
		return true
	}

	if item.LastRetryAt == nil {
		return true
	}

	backoff := calculateBackoff(item.RetryCount)
	nextRetry := item.LastRetryAt.Add(backoff)

	return time.Now().After(nextRetry)
}

// syncItem syncs a single queue item
func (w *Worker) syncItem(ctx context.Context, item database.SyncQueue) error {
	startTime := time.Now()

	// Mark as PROCESSING
	w.db.Model(&database.SyncQueue{}).
		Where("id = ?", item.ID).
		Updates(map[string]interface{}{
			"status":     string(types.QueueStatusProcessing),
			"updated_at": time.Now(),
		})

	// Parse payload
	var timbanganData types.TimbanganData
	if err := json.Unmarshal([]byte(item.PayloadJSON), &timbanganData); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}

	// Send to server with retry
	var syncResult *types.SyncResult
	var syncErr error

	syncErr = w.client.ExecuteWithRetry(ctx, func(ctx context.Context) error {
		result, err := w.client.SyncSingleRecord(ctx, timbanganData)
		if err != nil {
			return err
		}
		syncResult = result
		return nil
	}, 3)

	if syncErr != nil {
		return syncErr
	}

	// Record sync history
	duration := time.Since(startTime)
	w.recordSyncHistory(item, "SUCCESS", nil, duration)

	// Update timbangan record
	updates := map[string]interface{}{
		"status_sync":  string(types.SyncStatusSynced),
		"synced_at":    time.Now(),
		"error_message": nil,
	}

	if syncResult.IDPusat != nil {
		updates["id_pusat"] = *syncResult.IDPusat
	}

	err := w.db.Model(&database.Timbangan{}).
		Where("id_local = ?", item.EntityID).
		Updates(updates).Error

	if err != nil {
		log.Printf("Failed to update timbangan status: %v", err)
	}

	return nil
}

// handleSyncSuccess handles successful sync
func (w *Worker) handleSyncSuccess(item database.SyncQueue) {
	// Begin transaction
	tx := w.db.Begin()
	if tx.Error != nil {
		log.Printf("Failed to begin transaction: %v", tx.Error)
		return
	}

	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC in handleSyncSuccess for item %s: %v", item.ID.String(), r)
			tx.Rollback()
		}
	}()

	// Update sync queue
	err := tx.Model(&database.SyncQueue{}).
		Where("id = ?", item.ID).
		Updates(map[string]interface{}{
			"status":     string(types.QueueStatusSuccess),
			"updated_at": time.Now(),
		}).Error

	if err != nil {
		tx.Rollback()
		log.Printf("Failed to update sync queue: %v", err)
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("Failed to commit transaction: %v", err)
		return
	}

	log.Printf("Successfully synced item: %s", item.ID.String())
}

// handleSyncFailure handles sync failure
func (w *Worker) handleSyncFailure(item database.SyncQueue, err error) {
	retryCount := item.RetryCount + 1
	now := time.Now()

	status := string(types.QueueStatusFailed)
	if retryCount >= item.MaxRetries {
		status = string(types.QueueStatusAbandoned)
		log.Printf("Item abandoned after %d retries: %s - %v", retryCount, item.ID.String(), err)
	} else {
		log.Printf("Sync failed (attempt %d/%d): %s - %v", retryCount, item.MaxRetries, item.ID.String(), err)
	}

	// Record sync history
	duration := time.Duration(0)
	w.recordSyncHistory(item, "FAILED", err, duration)

	// Update sync queue
	errMsg := err.Error()
	updates := map[string]interface{}{
		"status":        status,
		"retry_count":   retryCount,
		"last_error":    errMsg,
		"last_retry_at": &now,
		"updated_at":    now,
	}

	w.db.Model(&database.SyncQueue{}).
		Where("id = ?", item.ID).
		Updates(updates)

	// Update timbangan record
	w.db.Model(&database.Timbangan{}).
		Where("id_local = ?", item.EntityID).
		Updates(map[string]interface{}{
			"status_sync":   string(types.SyncStatusFailed),
			"error_message": errMsg,
		})
}

// recordSyncHistory records sync attempt in history table
func (w *Worker) recordSyncHistory(item database.SyncQueue, status string, err error, duration time.Duration) {
	var errorMsg *string
	if err != nil {
		msg := err.Error()
		errorMsg = &msg
	}

	history := &database.SyncHistory{
		QueueID:      &item.ID,
		EntityType:   item.EntityType,
		EntityID:     item.EntityID,
		AttemptNumber: item.RetryCount + 1,
		Status:       status,
		ErrorMessage: errorMsg,
		RequestPayload: &item.PayloadJSON,
		DurationMs:   int(duration.Milliseconds()),
	}

	if err := w.db.Create(history).Error; err != nil {
		log.Printf("Failed to record sync history: %v", err)
	}
}

// TriggerManualSync triggers immediate sync processing
func (w *Worker) TriggerManualSync() {
	log.Println("Manual sync triggered")
	go w.processQueue()
}

// GetSyncStats returns current sync statistics
func (w *Worker) GetSyncStats() map[string]interface{} {
	stats := make(map[string]interface{})

	// Count pending items
	var pendingCount int64
	w.db.Model(&database.SyncQueue{}).
		Where("status IN ?", []string{
			string(types.QueueStatusPending),
			string(types.QueueStatusFailed),
		}).
		Count(&pendingCount)

	stats["pending"] = pendingCount
	stats["serverHealthy"] = w.isServerHealthy()

	// Get last sync time
	var lastQueue database.SyncQueue
	err := w.db.Where("status = ?", string(types.QueueStatusSuccess)).
		Order("updated_at DESC").
		First(&lastQueue).Error

	if err == nil {
		stats["lastSyncTime"] = lastQueue.UpdatedAt
	}

	return stats
}
