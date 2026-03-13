package entities

import (
	"time"

	"github.com/google/uuid"
)

// APIKey represents an API key for synchronization
type APIKey struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Key         string    `gorm:"column:api_key;type:varchar(255);not null" json:"-"`
	Description string    `gorm:"type:text" json:"description"`
	ServerURL   string    `gorm:"type:varchar(255);not null" json:"serverUrl"`
	IsActive    bool      `gorm:"default:true" json:"isActive"`

	// Metadata
	CreatedBy   uuid.UUID `gorm:"type:uuid" json:"createdBy"`
	CreatorUser *User     `gorm:"foreignKey:CreatedBy;references:ID" json:"creatorUser,omitempty"`

	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
	LastUsedAt *time.Time `json:"lastUsedAt"`
}

// TableName specifies the table name for APIKey
func (APIKey) TableName() string {
	return "api_keys"
}
