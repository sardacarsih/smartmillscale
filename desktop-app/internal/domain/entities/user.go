package entities

import (
	"time"

	"github.com/google/uuid"
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

// User represents a system user - pure domain entity
type User struct {
	// Primary Key
	ID uuid.UUID `json:"id"`

	// Credentials
	Username     string `json:"username"`
	PasswordHash string `json:"-"` // Never expose password hash in JSON

	// Profile
	FullName string   `json:"fullName"`
	Email    string   `json:"email"`
	Role     UserRole `json:"role"`

	// Status
	IsActive           bool `json:"isActive"`
	MustChangePassword bool `json:"mustChangePassword"`

	// Timestamps
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	LastLoginAt *time.Time `json:"lastLoginAt"`

	// Audit
	CreatedBy *uuid.UUID `json:"createdBy"` // Which admin created this user
}

// NewUser creates a new User entity with proper initialization
func NewUser(username, fullName, email string, role UserRole, createdBy *uuid.UUID) *User {
	now := time.Now()
	return &User{
		ID:                 uuid.New(),
		Username:           username,
		FullName:           fullName,
		Email:              email,
		Role:               role,
		IsActive:           true,
		MustChangePassword: false,
		CreatedAt:          now,
		UpdatedAt:          now,
		CreatedBy:          createdBy,
	}
}

// IsActiveUser checks if the user is active
func (u *User) IsActiveUser() bool {
	return u.IsActive
}

// HasRole checks if the user has the specified role
func (u *User) HasRole(role UserRole) bool {
	return u.Role == role
}

// HasAnyRole checks if the user has any of the specified roles
func (u *User) HasAnyRole(roles ...UserRole) bool {
	for _, role := range roles {
		if u.Role == role {
			return true
		}
	}
	return false
}

// IsAdmin checks if the user is an admin
func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

// IsSupervisor checks if the user is a supervisor or admin
func (u *User) IsSupervisor() bool {
	return u.Role == RoleSupervisor || u.Role == RoleAdmin
}

// CanPerformWeighing checks if the user can perform weighing operations
func (u *User) CanPerformWeighing() bool {
	return u.IsActive && (u.Role == RoleTimbangan || u.Role == RoleGrading || u.IsSupervisor())
}

// UpdateLastLogin updates the last login timestamp
func (u *User) UpdateLastLogin() {
	now := time.Now()
	u.LastLoginAt = &now
	u.UpdatedAt = now
}

// Deactivate deactivates the user
func (u *User) Deactivate() {
	u.IsActive = false
	u.UpdatedAt = time.Now()
}

// Activate activates the user
func (u *User) Activate() {
	u.IsActive = true
	u.UpdatedAt = time.Now()
}

// RequirePasswordChange marks that the user must change password
func (u *User) RequirePasswordChange() {
	u.MustChangePassword = true
	u.UpdatedAt = time.Now()
}

// PasswordChanged marks that the user has changed password
func (u *User) PasswordChanged() {
	u.MustChangePassword = false
	u.UpdatedAt = time.Now()
}

// UpdateProfile updates user profile information
func (u *User) UpdateProfile(fullName, email string) {
	u.FullName = fullName
	u.Email = email
	u.UpdatedAt = time.Now()
}

// SetPassword sets the user's password hash (hashing should be done at application layer)
func (u *User) SetPassword(passwordHash string) {
	u.PasswordHash = passwordHash
	u.UpdatedAt = time.Now()
}

// VerifyPassword verifies if the provided password matches the user's password hash
// (verification should be done at application layer)
func (u *User) VerifyPassword(password string) bool {
	// This should be implemented in the application layer with proper password verification
	// keeping the domain entity pure from security dependencies
	return false // Placeholder - actual implementation in service layer
}