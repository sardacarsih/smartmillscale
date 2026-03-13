package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DeviceInfoModel represents the GORM model for device info
type DeviceInfoModel struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	DeviceName  string     `gorm:"type:varchar(255);not null" json:"deviceName"`
	Location    string     `gorm:"type:varchar(255)" json:"location"`
	APIKey      string     `gorm:"type:varchar(500);not null" json:"apiKey"` // Stored in OS keyring, this is just device ID reference
	ServerURL   string     `gorm:"type:varchar(500);not null" json:"serverUrl"`
	IsActive    bool       `gorm:"default:true" json:"isActive"`
	CreatedAt   time.Time  `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time  `gorm:"not null;autoUpdateTime" json:"updatedAt"`
	LastSeenAt  *time.Time `gorm:"" json:"lastSeenAt"`
}

// TableName specifies the table name for DeviceInfoModel
func (DeviceInfoModel) TableName() string {
	return "device_info"
}

// BeforeCreate hook to set UUID
func (di *DeviceInfoModel) BeforeCreate(tx *gorm.DB) error {
	if di.ID == uuid.Nil {
		di.ID = uuid.New()
	}
	return nil
}

// WeighingSessionModel represents the GORM model for weighing session
type WeighingSessionModel struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	OperatorID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"operatorId"`
	SessionStart  time.Time  `gorm:"not null" json:"sessionStart"`
	SessionEnd    *time.Time `gorm:"" json:"sessionEnd"`
	TotalWeighings int       `gorm:"default:0" json:"totalWeighings"`
	TotalWeight   int        `gorm:"default:0" json:"totalWeight"`
	AverageWeight float64    `gorm:"" json:"averageWeight"`
	BreakCount    int        `gorm:"default:0" json:"breakCount"`
	LastBreakAt   *time.Time `gorm:"" json:"lastBreakAt"`
	Notes         string     `gorm:"type:text" json:"notes"`
	DeviceID      string     `gorm:"type:varchar(100);not null;index" json:"deviceId"`
	CreatedAt     time.Time  `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time  `gorm:"not null;autoUpdateTime" json:"updatedAt"`
}

// TableName specifies the table name for WeighingSessionModel
func (WeighingSessionModel) TableName() string {
	return "weighing_sessions"
}

// BeforeCreate hook to set UUID
func (ws *WeighingSessionModel) BeforeCreate(tx *gorm.DB) error {
	if ws.ID == uuid.Nil {
		ws.ID = uuid.New()
	}
	return nil
}

// AuditLogModel represents the GORM model for audit log
type AuditLogModel struct {
	// Primary Key
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// User Information
	UserID   *uuid.UUID `gorm:"type:uuid;index" json:"userId"` // Nullable for failed login attempts
	Username string     `gorm:"type:varchar(50);not null;index" json:"username"`

	// Action Details
	Action     string `gorm:"type:varchar(100);not null;index" json:"action"` // LOGIN, LOGOUT, CREATE_WEIGHING, etc.
	EntityType string `gorm:"type:varchar(50)" json:"entityType"`             // "weighing", "user", "config"
	EntityID   *uuid.UUID `gorm:"type:uuid" json:"entityId"`                  // FK to the affected entity

	// Additional Context
	Details   *string `gorm:"type:text" json:"details"`   // JSON details
	IPAddress string  `gorm:"type:varchar(45)" json:"ipAddress"` // Always "localhost" for desktop, but kept for completeness

	// Result
	Success  bool    `gorm:"not null" json:"success"`
	ErrorMsg *string `gorm:"type:text" json:"errorMsg"`

	// Timestamp
	Timestamp time.Time `gorm:"not null;autoCreateTime;index" json:"timestamp"`
}

// TableName specifies the table name for AuditLogModel
func (AuditLogModel) TableName() string {
	return "audit_logs"
}

// BeforeCreate hook to set UUID if not provided
func (al *AuditLogModel) BeforeCreate(tx *gorm.DB) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	return nil
}