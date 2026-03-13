package entities

import (
	"time"

	"github.com/google/uuid"
)

// AuditLog represents audit trail for security-sensitive operations
type AuditLog struct {
	// Primary Key
	ID uuid.UUID

	// User Information
	UserID   *uuid.UUID
	Username string

	// Action Details
	Action     string
	EntityType string
	EntityID   *uuid.UUID

	// Additional Context
	Details   *string
	IPAddress string

	// Result
	Success  bool
	ErrorMsg *string

	// Timestamp
	Timestamp time.Time
}

// NewAuditLog creates a new audit log entry
func NewAuditLog(username, action string, userID *uuid.UUID) *AuditLog {
	return &AuditLog{
		ID:        uuid.New(),
		UserID:    userID,
		Username:  username,
		Action:    action,
		IPAddress: "localhost", // Desktop app always runs locally
		Success:   true,
		Timestamp: time.Now(),
	}
}

// WithEntity sets the entity information
func (a *AuditLog) WithEntity(entityType string, entityID *uuid.UUID) *AuditLog {
	a.EntityType = entityType
	a.EntityID = entityID
	return a
}

// WithDetails sets additional details
func (a *AuditLog) WithDetails(details string) *AuditLog {
	a.Details = &details
	return a
}

// MarkFailed marks the audit log as failed
func (a *AuditLog) MarkFailed(errMsg string) {
	a.Success = false
	a.ErrorMsg = &errMsg
}