package dto

import (
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/shared/utils"
)

// UserDTO represents user data for API responses
type UserDTO struct {
	ID       string    `json:"id"`
	Username string    `json:"username"`
	FullName string    `json:"full_name"`
	Email    string    `json:"email,omitempty"`
	Role     string    `json:"role"`
	IsActive bool      `json:"is_active"`
	LastLoginAt *string `json:"last_login_at,omitempty"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

// SessionDTO represents session data for API responses
type SessionDTO struct {
	UserID       string `json:"user_id"`
	Username     string `json:"username"`
	Role         string `json:"role"`
	FullName     string `json:"full_name"`
	DeviceID     string `json:"device_id"`
	LoginTime    string `json:"login_time"`
	LastActivity string `json:"last_activity"`
	ExpiresAt    string `json:"expires_at"`
}

// LoginRequestDTO represents login request data
type LoginRequestDTO struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=8"`
	DeviceID string `json:"device_id,omitempty"`
}

// LoginResponseDTO represents login response data
type LoginResponseDTO struct {
	User    *UserDTO    `json:"user"`
	Session *SessionDTO `json:"session"`
}

// ChangePasswordRequestDTO represents change password request
type ChangePasswordRequestDTO struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=NewPassword"`
}

// CreateUserRequestDTO represents create user request
type CreateUserRequestDTO struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	FullName string `json:"full_name" binding:"required,min=2,max=100"`
	Email    string `json:"email,omitempty" binding:"email"`
	Role     string `json:"role" binding:"required,oneof=ADMIN SUPERVISOR TIMBANGAN GRADING"`
	Password string `json:"password" binding:"required,min=8"`
	IsActive *bool  `json:"is_active,omitempty"`
}

// UpdateUserRequestDTO represents update user request
type UpdateUserRequestDTO struct {
	ID       string  `json:"id" binding:"required,uuid"`
	FullName *string `json:"full_name,omitempty" binding:"omitempty,min=2,max=100"`
	Email    *string `json:"email,omitempty" binding:"omitempty,email"`
	Role     *string `json:"role,omitempty" binding:"omitempty,oneof=ADMIN SUPERVISOR TIMBANGAN GRADING"`
	IsActive *bool   `json:"is_active,omitempty"`
}

// UserSearchRequestDTO represents user search request
type UserSearchRequestDTO struct {
	Query    string `json:"query,omitempty" binding:"max=100"`
	Role     string `json:"role,omitempty" binding:"omitempty,oneof=ADMIN SUPERVISOR TIMBANGAN GRADING"`
	IsActive *bool  `json:"is_active,omitempty"`
	Page     int    `json:"page,omitempty" binding:"omitempty,min=1"`
	PerPage  int    `json:"per_page,omitempty" binding:"omitempty,min=1,max=100"`
}

// NewUserDTO converts auth.User to UserDTO
func NewUserDTO(user *auth.User) *UserDTO {
	dto := &UserDTO{
		ID:        user.ID.String(),
		Username:  user.Username,
		FullName:  user.FullName,
		Email:     user.Email,
		Role:      user.Role.String(),
		IsActive:  user.IsActive,
		CreatedAt: utils.FormatTimestamp(user.CreatedAt),
		UpdatedAt: utils.FormatTimestamp(user.UpdatedAt),
	}

	if user.LastLoginAt != nil {
		lastLogin := utils.FormatTimestamp(*user.LastLoginAt)
		dto.LastLoginAt = &lastLogin
	}

	return dto
}

// NewSessionDTO converts auth.UserSession to SessionDTO
func NewSessionDTO(session *auth.UserSession) *SessionDTO {
	return &SessionDTO{
		UserID:       session.UserID.String(),
		Username:     session.Username,
		Role:         session.Role.String(),
		FullName:     session.FullName,
		DeviceID:     session.DeviceID,
		LoginTime:    utils.FormatTimestamp(session.LoginTime),
		LastActivity: utils.FormatTimestamp(session.LastActivity),
		ExpiresAt:    utils.FormatTimestamp(session.LoginTime.Add(8 * time.Hour)), // 8 hour expiry
	}
}

// NewLoginResponseDTO creates login response DTO
func NewLoginResponseDTO(user *auth.User, session *auth.UserSession) *LoginResponseDTO {
	return &LoginResponseDTO{
		User:    NewUserDTO(user),
		Session: NewSessionDTO(session),
	}
}

// Validate validates login request DTO
func (r *LoginRequestDTO) Validate() map[string]string {
	errors := make(map[string]string)

	if r.Username == "" {
		errors["username"] = "Username is required"
	} else if len(r.Username) < 3 {
		errors["username"] = "Username must be at least 3 characters"
	} else if len(r.Username) > 50 {
		errors["username"] = "Username must be less than 50 characters"
	}

	if r.Password == "" {
		errors["password"] = "Password is required"
	} else if len(r.Password) < 8 {
		errors["password"] = "Password must be at least 8 characters"
	}

	return errors
}

// Validate validates change password request DTO
func (r *ChangePasswordRequestDTO) Validate() map[string]string {
	errors := make(map[string]string)

	if r.CurrentPassword == "" {
		errors["current_password"] = "Current password is required"
	}

	if r.NewPassword == "" {
		errors["new_password"] = "New password is required"
	} else if len(r.NewPassword) < 8 {
		errors["new_password"] = "New password must be at least 8 characters"
	}

	if r.ConfirmPassword == "" {
		errors["confirm_password"] = "Password confirmation is required"
	} else if r.NewPassword != r.ConfirmPassword {
		errors["confirm_password"] = "Password confirmation does not match"
	}

	return errors
}

// Validate validates create user request DTO
func (r *CreateUserRequestDTO) Validate() map[string]string {
	errors := make(map[string]string)

	if r.Username == "" {
		errors["username"] = "Username is required"
	} else if len(r.Username) < 3 {
		errors["username"] = "Username must be at least 3 characters"
	} else if len(r.Username) > 50 {
		errors["username"] = "Username must be less than 50 characters"
	}

	if r.FullName == "" {
		errors["full_name"] = "Full name is required"
	} else if len(r.FullName) < 2 {
		errors["full_name"] = "Full name must be at least 2 characters"
	} else if len(r.FullName) > 100 {
		errors["full_name"] = "Full name must be less than 100 characters"
	}

	if r.Email != "" {
		// Basic email validation
		if len(r.Email) > 100 {
			errors["email"] = "Email must be less than 100 characters"
		}
	}

	if r.Role == "" {
		errors["role"] = "Role is required"
	} else if !isValidRole(r.Role) {
		errors["role"] = "Role must be one of: ADMIN, SUPERVISOR, TIMBANGAN, GRADING"
	}

	if r.Password == "" {
		errors["password"] = "Password is required"
	} else if len(r.Password) < 8 {
		errors["password"] = "Password must be at least 8 characters"
	}

	return errors
}

// isValidRole checks if role is valid
func isValidRole(role string) bool {
	validRoles := []string{"ADMIN", "SUPERVISOR", "TIMBANGAN", "GRADING"}
	for _, validRole := range validRoles {
		if role == validRole {
			return true
		}
	}
	return false
}