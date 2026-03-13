package models

import "time"

// SystemSettingsModel represents persisted system settings payload.
// This table is designed as a single-row key/value store (GLOBAL key).
type SystemSettingsModel struct {
	Key         string    `gorm:"type:varchar(50);primaryKey" json:"key"`
	Version     int       `gorm:"not null;default:1" json:"version"`
	PayloadJSON string    `gorm:"type:text;not null" json:"payloadJson"`
	CreatedAt   time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"not null;autoUpdateTime" json:"updatedAt"`
}

// TableName specifies the table name for SystemSettingsModel.
func (SystemSettingsModel) TableName() string {
	return "system_settings"
}
