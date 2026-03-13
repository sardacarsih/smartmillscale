package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserModel represents the GORM model for user
type UserModel struct {
	// Primary Key
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// Credentials
	Username     string `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	PasswordHash string `gorm:"type:varchar(255);not null" json:"-"` // Never expose password hash in JSON

	// Profile
	FullName string `gorm:"type:varchar(100);not null" json:"fullName"`
	Email    string `gorm:"type:varchar(100)" json:"email"`
	Role     string `gorm:"type:varchar(20);not null;index" json:"role"`

	// Status
	IsActive           bool `gorm:"default:true;not null" json:"isActive"`
	MustChangePassword bool `gorm:"default:false;not null" json:"mustChangePassword"`

	// Timestamps
	CreatedAt   time.Time  `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time  `gorm:"not null;autoUpdateTime" json:"updatedAt"`
	LastLoginAt *time.Time `gorm:"" json:"lastLoginAt"`

	// Audit
	CreatedBy *uuid.UUID `gorm:"type:uuid" json:"createdBy"` // Which admin created this user
}

// TableName specifies the table name for UserModel
func (UserModel) TableName() string {
	return "users"
}

// BeforeCreate hook to set UUID if not provided
func (u *UserModel) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}