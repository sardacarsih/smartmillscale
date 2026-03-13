package entities

import (
	"time"

	"github.com/google/uuid"
)

// QueueStatus represents the status of sync queue items
type QueueStatus string

const (
	QueueStatusPending   QueueStatus = "PENDING"
	QueueStatusProcessing QueueStatus = "PROCESSING"
	QueueStatusSuccess   QueueStatus = "SUCCESS"
	QueueStatusFailed    QueueStatus = "FAILED"
	QueueStatusAbandoned QueueStatus = "ABANDONED"
)

// SyncQueue represents a queue item for synchronization - pure domain entity
type SyncQueue struct {
	// Primary Key
	ID uuid.UUID

	// Entity Information
	EntityType string
	EntityID   uuid.UUID

	// Payload
	PayloadJSON string

	// Sync Status
	Status      QueueStatus
	RetryCount  int
	MaxRetries  int
	LastError   *string
	LastRetryAt *time.Time

	// Timestamps
	CreatedAt time.Time
	UpdatedAt time.Time

	// Idempotency
	IdempotencyKey string
}

// NewSyncQueue creates a new sync queue item
func NewSyncQueue(entityType string, entityID uuid.UUID, payloadJSON string) *SyncQueue {
	now := time.Now()
	return &SyncQueue{
		ID:            uuid.New(),
		EntityType:    entityType,
		EntityID:      entityID,
		PayloadJSON:   payloadJSON,
		Status:        QueueStatusPending,
		RetryCount:    0,
		MaxRetries:    5,
		CreatedAt:     now,
		UpdatedAt:     now,
		IdempotencyKey: uuid.New().String(),
	}
}

// MarkAsProcessing marks the queue item as being processed
func (sq *SyncQueue) MarkAsProcessing() {
	sq.Status = QueueStatusProcessing
	sq.UpdatedAt = time.Now()
}

// MarkAsSuccess marks the queue item as successfully processed
func (sq *SyncQueue) MarkAsSuccess() {
	sq.Status = QueueStatusSuccess
	sq.UpdatedAt = time.Now()
}

// MarkAsFailed marks the queue item as failed with retry
func (sq *SyncQueue) MarkAsFailed(err error) {
	sq.Status = QueueStatusFailed
	sq.RetryCount++
	sq.LastRetryAt = &[]time.Time{time.Now()}[0]
	if err != nil {
		errMsg := err.Error()
		sq.LastError = &errMsg
	}
	sq.UpdatedAt = time.Now()
}

// MarkAsAbandoned marks the queue item as abandoned (max retries reached)
func (sq *SyncQueue) MarkAsAbandoned() {
	sq.Status = QueueStatusAbandoned
	sq.UpdatedAt = time.Now()
}

// IsPending checks if the item is pending processing
func (sq *SyncQueue) IsPending() bool {
	return sq.Status == QueueStatusPending
}

// IsProcessing checks if the item is currently being processed
func (sq *SyncQueue) IsProcessing() bool {
	return sq.Status == QueueStatusProcessing
}

// IsCompleted checks if the item processing is complete (success or abandoned)
func (sq *SyncQueue) IsCompleted() bool {
	return sq.Status == QueueStatusSuccess || sq.Status == QueueStatusAbandoned
}

// CanRetry checks if the item can be retried
func (sq *SyncQueue) CanRetry() bool {
	return sq.Status == QueueStatusFailed && sq.RetryCount < sq.MaxRetries
}

// ShouldAbandon checks if the item should be abandoned
func (sq *SyncQueue) ShouldAbandon() bool {
	return sq.Status == QueueStatusFailed && sq.RetryCount >= sq.MaxRetries
}

// SyncHistory represents audit log of sync attempts - pure domain entity
type SyncHistory struct {
	// Primary Key
	ID uuid.UUID

	// References
	QueueID    *uuid.UUID
	EntityType string
	EntityID   uuid.UUID

	// Attempt Details
	AttemptNumber int
	Status        string // SUCCESS | FAILED
	ErrorMessage  *string

	// Request/Response
	RequestPayload  *string
	ResponsePayload *string

	// Performance
	DurationMs int

	// Timestamp
	AttemptedAt time.Time
}

// NewSyncHistory creates a new sync history entry
func NewSyncHistory(entityType string, entityID uuid.UUID, attemptNumber int, status string) *SyncHistory {
	return &SyncHistory{
		ID:            uuid.New(),
		EntityType:    entityType,
		EntityID:      entityID,
		AttemptNumber: attemptNumber,
		Status:        status,
		AttemptedAt:   time.Now(),
	}
}

// WithQueue sets the queue reference
func (sh *SyncHistory) WithQueue(queueID *uuid.UUID) *SyncHistory {
	sh.QueueID = queueID
	return sh
}

// WithError sets the error message
func (sh *SyncHistory) WithError(errMsg string) *SyncHistory {
	sh.ErrorMessage = &errMsg
	return sh
}

// WithPayloads sets the request and response payloads
func (sh *SyncHistory) WithPayloads(request, response *string) *SyncHistory {
	sh.RequestPayload = request
	sh.ResponsePayload = response
	return sh
}

// WithDuration sets the duration
func (sh *SyncHistory) WithDuration(durationMs int) *SyncHistory {
	sh.DurationMs = durationMs
	return sh
}