package dto

import (
	"time"

	"github.com/google/uuid"
)

// CreateUserRequest represents request to create a user
type CreateUserRequest struct {
	Username           string `json:"username" validate:"required,min=3,max=50"`
	Password           string `json:"password" validate:"required,min=8"`
	FullName           string `json:"fullName" validate:"required,max=100"`
	Email              string `json:"email" validate:"omitempty,email,max=100"`
	Role               string `json:"role" validate:"required,oneof=ADMIN SUPERVISOR TIMBANGAN GRADING"`
	IsActive           bool   `json:"isActive"`
	MustChangePassword bool   `json:"mustChangePassword"`
}

// UpdateUserRequest represents request to update a user
type UpdateUserRequest struct {
	ID                 uuid.UUID `json:"id" validate:"required"`
	Username           string    `json:"username" validate:"required,min=3,max=50"`
	FullName           string    `json:"fullName" validate:"required,max=100"`
	Email              string    `json:"email" validate:"omitempty,email,max=100"`
	Role               string    `json:"role" validate:"required,oneof=ADMIN SUPERVISOR TIMBANGAN GRADING"`
	IsActive           bool      `json:"isActive"`
	MustChangePassword bool      `json:"mustChangePassword"`
}

// ChangePasswordRequest represents request to change password
type ChangePasswordRequest struct {
	UserID      uuid.UUID `json:"userId" validate:"required"`
	OldPassword string    `json:"oldPassword" validate:"required"`
	NewPassword string    `json:"newPassword" validate:"required,min=8"`
}

// ResetPasswordRequest represents request to reset password
type ResetPasswordRequest struct {
	UserID      uuid.UUID `json:"userId" validate:"required"`
	NewPassword string    `json:"newPassword" validate:"required,min=8"`
}

// UserResponse represents user response
type UserResponse struct {
	ID                 uuid.UUID  `json:"id"`
	Username           string     `json:"username"`
	FullName           string     `json:"fullName"`
	Email              string     `json:"email"`
	Role               string     `json:"role"`
	IsActive           bool       `json:"isActive"`
	MustChangePassword bool       `json:"mustChangePassword"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
	LastLoginAt        *time.Time `json:"lastLoginAt"`
	CreatedBy          *uuid.UUID `json:"createdBy"`
}

// UserSearchRequest represents search request for users
type UserSearchRequest struct {
	Query  string `json:"query" form:"query"`
	Role   string `json:"role" form:"role"`
	Active *bool  `json:"active" form:"active"`
	Limit  int    `json:"limit" form:"limit"`
	Page   int    `json:"page" form:"page"`
}

// UserListResponse represents list response for users
type UserListResponse struct {
	Data       []UserResponse `json:"data"`
	Total      int            `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"totalPages"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
	DeviceID string `json:"deviceId"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	UserID    string `json:"userId,omitempty"`
	Username  string `json:"username,omitempty"`
	FullName  string `json:"fullName,omitempty"`
	Role      string `json:"role,omitempty"`
	SessionID string `json:"sessionId,omitempty"`
	ExpiresAt int64  `json:"expiresAt,omitempty"`
}

// UserSessionResponse represents user session response
type UserSessionResponse struct {
	UserID       uuid.UUID `json:"userId"`
	Username     string    `json:"username"`
	Role         string    `json:"role"`
	FullName     string    `json:"fullName"`
	LoginTime    time.Time `json:"loginTime"`
	LastActivity time.Time `json:"lastActivity"`
	DeviceID     string    `json:"deviceId"`
	IsExpired    bool      `json:"isExpired"`
	IsInactive   bool      `json:"isInactive"`
}

// UserStatisticsResponse represents user statistics
type UserStatisticsResponse struct {
	TotalUsers      int `json:"totalUsers"`
	ActiveUsers     int `json:"activeUsers"`
	InactiveUsers   int `json:"inactiveUsers"`
	AdminUsers      int `json:"adminUsers"`
	SupervisorUsers int `json:"supervisorUsers"`
	TimbanganUsers  int `json:"timbanganUsers"`
	GradingUsers    int `json:"gradingUsers"`
	TodayLogins     int `json:"todayLogins"`
}

// ImportUsersRequest represents bulk import request
type ImportUsersRequest struct {
	Users          []CreateUserRequest `json:"users" validate:"required,dive"`
	SkipDuplicates bool                `json:"skipDuplicates"`
	UpdateExisting bool                `json:"updateExisting"`
}

// ImportUsersResponse represents import result
type ImportUsersResponse struct {
	TotalRecords int      `json:"totalRecords"`
	SuccessCount int      `json:"successCount"`
	FailureCount int      `json:"failureCount"`
	SkippedCount int      `json:"skippedCount"`
	UpdatedCount int      `json:"updatedCount"`
	Errors       []string `json:"errors"`
	Warnings     []string `json:"warnings"`
}

// ExportUsersRequest represents export request
type ExportUsersRequest struct {
	Format string `json:"format" validate:"required,oneof=csv xlsx json"`
	Role   string `json:"role"`
	Active *bool  `json:"active"`
}

// PasswordPolicyResponse represents password policy
type PasswordPolicyResponse struct {
	MinLength      int  `json:"minLength"`
	RequireLetter  bool `json:"requireLetter"`
	RequireNumber  bool `json:"requireNumber"`
	RequireSpecial bool `json:"requireSpecial"`
	RequireUpper   bool `json:"requireUpper"`
	RequireLower   bool `json:"requireLower"`
}

// SessionCheckRequest represents session check request
type SessionCheckRequest struct {
	Token string `json:"token"`
}

// SessionCheckResponse represents session check response
type SessionCheckResponse struct {
	IsValid bool                 `json:"isValid"`
	Session *UserSessionResponse `json:"session,omitempty"`
}
