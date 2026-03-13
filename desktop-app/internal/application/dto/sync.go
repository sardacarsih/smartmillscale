package dto

import (
	"time"

	"github.com/google/uuid"
)

// SyncRequest represents request to trigger sync
type SyncRequest struct {
	ForceSync bool     `json:"forceSync"`
	EntityIDs []uuid.UUID `json:"entityIds,omitempty"`
	BatchSize int      `json:"batchSize,omitempty"`
}

// SyncResponse represents sync operation response
type SyncResponse struct {
	Success         bool      `json:"success"`
	Message         string    `json:"message"`
	TotalItems      int       `json:"totalItems"`
	ProcessedItems  int       `json:"processedItems"`
	SuccessCount    int       `json:"successCount"`
	FailureCount    int       `json:"failureCount"`
	RemainingItems  int       `json:"remainingItems"`
	Duration        int64     `json:"duration"` // milliseconds
	NextSyncAt      *time.Time `json:"nextSyncAt,omitempty"`
	Errors          []string  `json:"errors,omitempty"`
}

// SyncStatusResponse represents current sync status
type SyncStatusResponse struct {
	IsOnline        bool      `json:"isOnline"`
	LastSyncAt      *time.Time `json:"lastSyncAt"`
	NextSyncAt      *time.Time `json:"nextSyncAt"`
	PendingCount    int       `json:"pendingCount"`
	ProcessingCount int       `json:"processingCount"`
	FailedCount     int       `json:"failedCount"`
	SuccessCount    int       `json:"successCount"`
	TotalSynced     int       `json:"totalSynced"`
	SyncInProgress  bool      `json:"syncInProgress"`
	AutoSyncEnabled bool      `json:"autoSyncEnabled"`
	SyncInterval    int       `json:"syncInterval"` // seconds
}

// SyncQueueItem represents a sync queue item
type SyncQueueItem struct {
	ID            uuid.UUID  `json:"id"`
	EntityType    string     `json:"entityType"`
	EntityID      uuid.UUID  `json:"entityId"`
	Status        string     `json:"status"`
	RetryCount    int        `json:"retryCount"`
	MaxRetries    int        `json:"maxRetries"`
	LastError     *string    `json:"lastError"`
	LastRetryAt   *time.Time `json:"lastRetryAt"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

// SyncHistoryItem represents a sync history item
type SyncHistoryItem struct {
	ID             uuid.UUID  `json:"id"`
	QueueID        *uuid.UUID `json:"queueId"`
	EntityType     string     `json:"entityType"`
	EntityID       uuid.UUID  `json:"entityId"`
	AttemptNumber  int        `json:"attemptNumber"`
	Status         string     `json:"status"`
	ErrorMessage   *string    `json:"errorMessage"`
	DurationMs     int        `json:"durationMs"`
	AttemptedAt    time.Time  `json:"attemptedAt"`
}

// SyncStatisticsResponse represents sync statistics
type SyncStatisticsResponse struct {
	TotalAttempts    int     `json:"totalAttempts"`
	SuccessfulSyncs  int     `json:"successfulSyncs"`
	FailedSyncs      int     `json:"failedSyncs"`
	SuccessRate      float64 `json:"successRate"`
	AverageDuration  int     `json:"averageDuration"` // milliseconds
	LastSuccessfulAt *time.Time `json:"lastSuccessfulAt"`
	LastFailedAt     *time.Time `json:"lastFailedAt"`
	PendingItems     int     `json:"pendingItems"`
	ProcessingItems  int     `json:"processingItems"`
	FailedItems      int     `json:"failedItems"`
}

// SyncConfig represents sync configuration
type SyncConfig struct {
	AutoSyncEnabled   bool   `json:"autoSyncEnabled"`
	SyncInterval      int    `json:"syncInterval"`      // seconds
	MaxRetries        int    `json:"maxRetries"`
	RetryDelay        int    `json:"retryDelay"`        // seconds
	BatchSize         int    `json:"batchSize"`
	Timeout           int    `json:"timeout"`           // seconds
	OfflineMode       bool   `json:"offlineMode"`
	ServerURL         string `json:"serverUrl"`
	APIKey            string `json:"apiKey"`
	LastSyncSuccess   bool   `json:"lastSyncSuccess"`
	LastSyncAttempt   *time.Time `json:"lastSyncAttempt"`
	LastSyncSuccessAt *time.Time `json:"lastSyncSuccessAt"`
}

// SyncHealthCheckResponse represents sync health check
type SyncHealthCheckResponse struct {
	IsHealthy       bool      `json:"isHealthy"`
	ServerReachable bool      `json:"serverReachable"`
	LastCheckAt     time.Time `json:"lastCheckAt"`
	ResponseTime    int64     `json:"responseTime"` // milliseconds
	DatabaseStatus  string    `json:"databaseStatus"`
	QueueSize       int       `json:"queueSize"`
	ErrorMessages   []string  `json:"errorMessages,omitempty"`
}