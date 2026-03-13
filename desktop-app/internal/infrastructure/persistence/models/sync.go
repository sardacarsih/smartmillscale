package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SyncQueueModel represents the GORM model for sync queue
type SyncQueueModel struct {
	// Primary Key
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// Entity Information
	EntityType string    `gorm:"type:varchar(50);not null;index:idx_queue_entity,priority:1" json:"entityType"` // "timbangan"
	EntityID   uuid.UUID `gorm:"type:uuid;not null;index:idx_queue_entity,priority:2" json:"entityId"`          // FK to entity

	// Payload
	PayloadJSON string `gorm:"type:text;not null" json:"payloadJson"` // JSON representation of entity

	// Sync Status
	Status      string     `gorm:"type:varchar(20);not null;default:'PENDING';index:idx_queue_status,priority:1" json:"status"` // PENDING | PROCESSING | SUCCESS | FAILED | ABANDONED
	RetryCount  int        `gorm:"not null;default:0;index:idx_queue_status,priority:2" json:"retryCount"`
	MaxRetries  int        `gorm:"not null;default:5" json:"maxRetries"`
	LastError   *string    `gorm:"type:text" json:"lastError"`
	LastRetryAt *time.Time `gorm:"index" json:"lastRetryAt"`

	// Timestamps
	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"not null;autoUpdateTime;index:idx_queue_status,priority:3" json:"updatedAt"`

	// Idempotency
	IdempotencyKey string `gorm:"type:varchar(255);uniqueIndex" json:"idempotencyKey"`
}

// TableName specifies the table name for SyncQueueModel
func (SyncQueueModel) TableName() string {
	return "sync_queue"
}

// BeforeCreate hook to set UUID and defaults
func (sq *SyncQueueModel) BeforeCreate(tx *gorm.DB) error {
	if sq.ID == uuid.Nil {
		sq.ID = uuid.New()
	}
	if sq.Status == "" {
		sq.Status = "PENDING"
	}
	if sq.MaxRetries == 0 {
		sq.MaxRetries = 5
	}
	return nil
}

// SyncHistoryModel represents the GORM model for sync history
type SyncHistoryModel struct {
	// Primary Key
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// References
	QueueID    *uuid.UUID `gorm:"type:uuid;index" json:"queueId"`                                           // Reference to sync queue
	EntityType string     `gorm:"type:varchar(50);not null;index" json:"entityType"`                        // "timbangan"
	EntityID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"entityId"`                                 // FK to entity

	// Attempt Details
	AttemptNumber int    `gorm:"not null" json:"attemptNumber"` // Which retry attempt (1-based)
	Status        string `gorm:"type:varchar(20);not null" json:"status"` // SUCCESS | FAILED
	ErrorMessage  *string `gorm:"type:text" json:"errorMessage"`

	// Request/Response
	RequestPayload  *string `gorm:"type:text" json:"requestPayload"`
	ResponsePayload *string `gorm:"type:text" json:"responsePayload"`

	// Performance
	DurationMs int `gorm:"not null" json:"durationMs"` // Request duration in milliseconds

	// Timestamp
	AttemptedAt time.Time `gorm:"not null;autoCreateTime;index" json:"attemptedAt"`
}

// TableName specifies the table name for SyncHistoryModel
func (SyncHistoryModel) TableName() string {
	return "sync_history"
}

// BeforeCreate hook to set UUID
func (sh *SyncHistoryModel) BeforeCreate(tx *gorm.DB) error {
	if sh.ID == uuid.Nil {
		sh.ID = uuid.New()
	}
	return nil
}