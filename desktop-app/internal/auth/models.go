package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserRole represents user roles in the system
type UserRole string

const (
	RoleAdmin      UserRole = "ADMIN"
	RoleSupervisor UserRole = "SUPERVISOR"
	RoleTimbangan  UserRole = "TIMBANGAN"
	RoleGrading    UserRole = "GRADING"
)

// String returns the string representation of UserRole
func (r UserRole) String() string {
	return string(r)
}

// User represents a system user
type User struct {
	// Primary Key
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// Credentials
	Username     string `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	PasswordHash string `gorm:"type:varchar(255);not null" json:"-"` // Never expose password hash in JSON

	// Profile
	FullName string `gorm:"type:varchar(100);not null" json:"fullName"`
	Email    string `gorm:"type:varchar(100)" json:"email"`
	Role     UserRole `gorm:"type:varchar(20);not null;index" json:"role"`

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

// TableName specifies the table name for User
func (User) TableName() string {
	return "users"
}

// SetPassword sets the user's password hash from plaintext password
func (u *User) SetPassword(password string) error {
	hash, err := HashPassword(password)
	if err != nil {
		return err
	}
	u.PasswordHash = hash
	return nil
}

// CheckPassword verifies if the provided password matches the user's password hash
func (u *User) CheckPassword(password string) bool {
	return CheckPasswordHash(password, u.PasswordHash)
}

// BeforeCreate hook to set UUID if not provided
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// AuditLog represents audit trail for security-sensitive operations
type AuditLog struct {
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

// TableName specifies the table name for AuditLog
func (AuditLog) TableName() string {
	return "audit_logs"
}

// BeforeCreate hook to set UUID if not provided
func (al *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	return nil
}

// UserSession represents an active user session (stored in memory, not in database)
type UserSession struct {
	UserID       uuid.UUID `json:"userId"`
	Username     string    `json:"username"`
	Role         UserRole  `json:"role"`
	FullName     string    `json:"fullName"`
	LoginTime    time.Time `json:"loginTime"`
	LastActivity time.Time `json:"lastActivity"`
	DeviceID     string    `json:"deviceId"` // Link to device info
}

// IsExpired checks if the session has expired (8 hour timeout)
func (s *UserSession) IsExpired() bool {
	return time.Since(s.LoginTime) > 8*time.Hour
}

// IsInactive checks if the session is inactive (30 minute timeout)
func (s *UserSession) IsInactive() bool {
	return time.Since(s.LastActivity) > 30*time.Minute
}

// UpdateActivity updates the last activity timestamp
func (s *UserSession) UpdateActivity() {
	s.LastActivity = time.Now()
}

// HasRole checks if the user has the specified role
func (s *UserSession) HasRole(role UserRole) bool {
	return s.Role == role
}

// HasAnyRole checks if the user has any of the specified roles
func (s *UserSession) HasAnyRole(roles ...UserRole) bool {
	for _, role := range roles {
		if s.Role == role {
			return true
		}
	}
	return false
}

// IsAdmin checks if the user is an admin
func (s *UserSession) IsAdmin() bool {
	return s.Role == RoleAdmin
}

// PasswordPolicy represents password policy configuration
type PasswordPolicy struct {
	MinLength      int  `json:"minLength"`      // Minimum password length
	RequireLetter  bool `json:"requireLetter"`  // Require at least one letter
	RequireNumber  bool `json:"requireNumber"`  // Require at least one number
	RequireSpecial bool `json:"requireSpecial"` // Require at least one special character
	RequireUpper   bool `json:"requireUpper"`   // Require at least one uppercase letter
	RequireLower   bool `json:"requireLower"`   // Require at least one lowercase letter
}

// GetDefaultPasswordPolicy returns the default password policy
func GetDefaultPasswordPolicy() PasswordPolicy {
	return PasswordPolicy{
		MinLength:      8,
		RequireLetter:  true,
		RequireNumber:  true,
		RequireSpecial: false,
		RequireUpper:   false,
		RequireLower:   false,
	}
}

// APIKey represents an API key for synchronization with the main server
type APIKey struct {
	// Primary Key
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// Information
	Name        string `gorm:"type:varchar(100);not null" json:"name"`
	Description string `gorm:"type:varchar(500)" json:"description"`
	APIKey      string `gorm:"type:varchar(500);not null" json:"-"` // Encrypted, excluded from JSON
	IsActive    bool   `gorm:"default:true" json:"isActive"`
	ServerURL   string `gorm:"type:varchar(500)" json:"serverUrl"`

	// Usage tracking
	LastUsedAt *time.Time `gorm:"" json:"lastUsedAt"` // Track when the API key was last used

	// Timestamps
	CreatedAt time.Time  `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time  `gorm:"not null;autoUpdateTime" json:"updatedAt"`

	// Audit
	CreatedBy *uuid.UUID `gorm:"type:uuid" json:"createdBy"`
	UpdatedBy *uuid.UUID `gorm:"type:uuid" json:"updatedBy"`

	// Associations
	CreatorUser *User `gorm:"foreignKey:CreatedBy" json:"creatorUser,omitempty"`
	UpdaterUser *User `gorm:"foreignKey:UpdatedBy" json:"updaterUser,omitempty"`
}

// TableName specifies the table name for APIKey
func (APIKey) TableName() string {
	return "api_keys"
}

// BeforeCreate hook to set UUID if not provided
func (a *APIKey) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// GetEncryptedAPIKey returns the encrypted API key (for internal use)
func (a *APIKey) GetEncryptedAPIKey() string {
	return a.APIKey
}

// SetAPIKey sets and encrypts the API key
func (a *APIKey) SetAPIKey(plaintextKey string) error {
	encrypted, err := encryptAPIKey(plaintextKey)
	if err != nil {
		return err
	}
	a.APIKey = encrypted
	return nil
}

// GetPlainAPIKey returns the decrypted API key (for internal use)
func (a *APIKey) GetPlainAPIKey() (string, error) {
	return decryptAPIKey(a.APIKey)
}

// UpdateLastUsed updates the last used timestamp to current time
func (a *APIKey) UpdateLastUsed() {
	now := time.Now()
	a.LastUsedAt = &now
}

// encryptAPIKey encrypts an API key using the encryption utilities
func encryptAPIKey(plaintext string) (string, error) {
	if !encryptionKeyInitialized {
		return "", fmt.Errorf("encryption not initialized")
	}
	return encrypt(plaintext)
}

// decryptAPIKey decrypts an API key using the encryption utilities
func decryptAPIKey(ciphertext string) (string, error) {
	if !encryptionKeyInitialized {
		return "", fmt.Errorf("encryption not initialized")
	}
	return decrypt(ciphertext)
}

// =====================================================
// Encryption Implementation (moved from utils package)
// =====================================================

// encryptionKey holds the current encryption key
var encryptionKeyInitialized bool
var encryptionKey []byte

// InitializeEncryption initializes the encryption for API keys
func InitializeEncryption(secret string) error {
	if len(secret) < 16 {
		return fmt.Errorf("encryption secret must be at least 16 characters")
	}

	// Create a 32-byte key from the secret
	hash := sha256.Sum256([]byte(secret))
	encryptionKey = hash[:]
	encryptionKeyInitialized = true
	return nil
}

// encrypt encrypts plaintext using AES-GCM
func encrypt(plaintext string) (string, error) {
	if len(encryptionKey) == 0 {
		return "", fmt.Errorf("encryption not initialized")
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decrypt decrypts ciphertext using AES-GCM
func decrypt(ciphertext string) (string, error) {
	if len(encryptionKey) == 0 {
		return "", fmt.Errorf("encryption not initialized")
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext_bytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext_bytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// IsInitialized checks if encryption is properly initialized
func IsEncryptionInitialized() bool {
	return encryptionKeyInitialized
}
