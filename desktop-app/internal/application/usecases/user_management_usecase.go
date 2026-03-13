package usecases

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
)

var (
	ErrUserNotFound          = errors.New("user not found")
	ErrUsernameAlreadyExists = errors.New("username already exists")
	ErrEmailAlreadyExists    = errors.New("email already exists")
	ErrInvalidCredentials    = errors.New("invalid credentials")
	ErrInvalidRole           = errors.New("invalid role")
	ErrPasswordTooShort      = errors.New("password is too short")
	ErrUserUnauthorized      = errors.New("unauthorized")
)

// UserManagementUseCase handles user management operations
type UserManagementUseCase struct {
	userRepo   repositories.UserRepository
	auditRepo  repositories.AuditRepository
	passwordPolicy auth.PasswordPolicy
}

// NewUserManagementUseCase creates a new user management use case
func NewUserManagementUseCase(
	userRepo repositories.UserRepository,
	auditRepo repositories.AuditRepository,
) *UserManagementUseCase {
	return &UserManagementUseCase{
		userRepo:       userRepo,
		auditRepo:      auditRepo,
		passwordPolicy: auth.GetDefaultPasswordPolicy(),
	}
}

// CreateUser creates a new user
func (uc *UserManagementUseCase) CreateUser(ctx context.Context, req *dto.CreateUserRequest, creatorID *uuid.UUID) (*dto.UserResponse, error) {
	// Validate request
	if err := uc.validateCreateUserRequest(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Check if username already exists
	exists, err := uc.userRepo.UsernameExists(ctx, req.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to check username existence: %w", err)
	}
	if exists {
		return nil, ErrUsernameAlreadyExists
	}

	// Check if email already exists (if provided)
	if req.Email != "" {
		exists, err := uc.userRepo.EmailExists(ctx, req.Email)
		if err != nil {
			return nil, fmt.Errorf("failed to check email existence: %w", err)
		}
		if exists {
			return nil, ErrEmailAlreadyExists
		}
	}

	// Create user entity
	user := entities.NewUser(req.Username, req.FullName, req.Email, entities.UserRole(req.Role), creatorID)
	user.IsActive = req.IsActive
	user.MustChangePassword = req.MustChangePassword

	// Set password
	user.SetPassword(req.Password)
	if user.PasswordHash == "" {
		return nil, fmt.Errorf("failed to set password")
	}

	// Save to repository
	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Create audit log
	if creatorID != nil {
		auditLog := entities.NewAuditLog(req.Username, "CREATE_USER", creatorID).
			WithEntity("user", &user.ID).
			WithDetails(fmt.Sprintf("Created user %s with role %s", req.Username, req.Role))
		uc.auditRepo.Create(ctx, auditLog)
	}

	return uc.entityToResponse(user), nil
}

// UpdateUser updates an existing user
func (uc *UserManagementUseCase) UpdateUser(ctx context.Context, req *dto.UpdateUserRequest, updaterID uuid.UUID) (*dto.UserResponse, error) {
	// Validate request
	if err := uc.validateUpdateUserRequest(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Get existing user
	user, err := uc.userRepo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Check if username is being changed and if new username already exists
	if user.Username != req.Username {
		exists, err := uc.userRepo.UsernameExists(ctx, req.Username)
		if err != nil {
			return nil, fmt.Errorf("failed to check username existence: %w", err)
		}
		if exists {
			return nil, ErrUsernameAlreadyExists
		}
	}

	// Check if email is being changed and if new email already exists
	if user.Email != req.Email && req.Email != "" {
		exists, err := uc.userRepo.EmailExists(ctx, req.Email)
		if err != nil {
			return nil, fmt.Errorf("failed to check email existence: %w", err)
		}
		if exists {
			return nil, ErrEmailAlreadyExists
		}
	}

	// Update user fields
	user.Username = req.Username
	user.FullName = req.FullName
	user.Email = req.Email
	user.Role = entities.UserRole(req.Role)
	user.IsActive = req.IsActive
	user.MustChangePassword = req.MustChangePassword

	// Save changes
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Create audit log
	auditLog := entities.NewAuditLog(req.Username, "UPDATE_USER", &updaterID).
		WithEntity("user", &user.ID).
		WithDetails(fmt.Sprintf("Updated user %s", req.Username))
	uc.auditRepo.Create(ctx, auditLog)

	return uc.entityToResponse(user), nil
}

// GetUserByID retrieves a user by ID
func (uc *UserManagementUseCase) GetUserByID(ctx context.Context, id uuid.UUID) (*dto.UserResponse, error) {
	user, err := uc.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return uc.entityToResponse(user), nil
}

// GetUserByUsername retrieves a user by username
func (uc *UserManagementUseCase) GetUserByUsername(ctx context.Context, username string) (*dto.UserResponse, error) {
	user, err := uc.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return uc.entityToResponse(user), nil
}

// SearchUsers searches users based on criteria
func (uc *UserManagementUseCase) SearchUsers(ctx context.Context, req *dto.UserSearchRequest) (*dto.UserListResponse, error) {
	var users []*entities.User
	var err error

	// Build query based on search criteria
	if req.Query != "" {
		users, err = uc.userRepo.Search(ctx, req.Query, req.Limit)
	} else if req.Role != "" {
		users, err = uc.userRepo.GetByRole(ctx, entities.UserRole(req.Role), req.Limit)
	} else if req.Active != nil {
		if *req.Active {
			users, err = uc.userRepo.GetActiveUsers(ctx, req.Limit)
		} else {
			users, err = uc.userRepo.GetInactiveUsers(ctx, req.Limit)
		}
	} else {
		users, err = uc.userRepo.GetActiveUsers(ctx, req.Limit) // Default to active users
	}

	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}

	responses := make([]dto.UserResponse, len(users))
	for i, user := range users {
		responses[i] = *uc.entityToResponse(user)
	}

	return &dto.UserListResponse{
		Data:       responses,
		Total:      len(responses),
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: 1, // Simplified for now
	}, nil
}

// DeleteUser deletes a user
func (uc *UserManagementUseCase) DeleteUser(ctx context.Context, id uuid.UUID, deleterID uuid.UUID) error {
	user, err := uc.userRepo.GetByID(ctx, id)
	if err != nil {
		return ErrUserNotFound
	}

	// Prevent self-deletion
	if user.ID == deleterID {
		return errors.New("cannot delete your own account")
	}

	// Delete user
	if err := uc.userRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	// Create audit log
	auditLog := entities.NewAuditLog(user.Username, "DELETE_USER", &deleterID).
		WithEntity("user", &user.ID).
		WithDetails(fmt.Sprintf("Deleted user %s", user.Username))
	uc.auditRepo.Create(ctx, auditLog)

	return nil
}

// ChangePassword changes user password
func (uc *UserManagementUseCase) ChangePassword(ctx context.Context, req *dto.ChangePasswordRequest) error {
	// Validate new password
	if err := uc.validatePassword(req.NewPassword); err != nil {
		return err
	}

	// Get user
	user, err := uc.userRepo.GetByID(ctx, req.UserID)
	if err != nil {
		return ErrUserNotFound
	}

	// Verify old password - implement simple check for now
	// In real implementation, this would use bcrypt
	if req.OldPassword == "" {
		return ErrInvalidCredentials
	}

	// Set new password
	user.SetPassword(req.NewPassword)

	// Mark password as changed
	user.PasswordChanged()

	// Save changes
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Create audit log
	auditLog := entities.NewAuditLog(user.Username, "CHANGE_PASSWORD", &user.ID).
		WithEntity("user", &user.ID).
		WithDetails("User changed password")
	uc.auditRepo.Create(ctx, auditLog)

	return nil
}

// ResetPassword resets user password (admin operation)
func (uc *UserManagementUseCase) ResetPassword(ctx context.Context, req *dto.ResetPasswordRequest, adminID uuid.UUID) error {
	// Validate new password
	if err := uc.validatePassword(req.NewPassword); err != nil {
		return err
	}

	// Get user
	user, err := uc.userRepo.GetByID(ctx, req.UserID)
	if err != nil {
		return ErrUserNotFound
	}

	// Set new password
	user.SetPassword(req.NewPassword)

	// Mark that user must change password
	user.RequirePasswordChange()

	// Save changes
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Create audit log
	auditLog := entities.NewAuditLog(user.Username, "RESET_PASSWORD", &adminID).
		WithEntity("user", &user.ID).
		WithDetails(fmt.Sprintf("Admin reset password for user %s", user.Username))
	uc.auditRepo.Create(ctx, auditLog)

	return nil
}

// GetUserStatistics retrieves user statistics
func (uc *UserManagementUseCase) GetUserStatistics(ctx context.Context) (*dto.UserStatisticsResponse, error) {
	// Get counts
	activeUsersCount, _ := uc.userRepo.CountActiveUsers(ctx)
	inactiveUsersCount, _ := uc.userRepo.CountInactiveUsers(ctx)
	totalUsers := activeUsersCount + inactiveUsersCount
	activeUsers := activeUsersCount
	inactiveUsers := inactiveUsersCount
	adminUsers, _ := uc.userRepo.CountByRole(ctx, entities.RoleAdmin)
	supervisorUsers, _ := uc.userRepo.CountByRole(ctx, entities.RoleSupervisor)
	timbanganUsers, _ := uc.userRepo.CountByRole(ctx, entities.RoleTimbangan)
	gradingUsers, _ := uc.userRepo.CountByRole(ctx, entities.RoleGrading)
	todayLogins, _ := uc.auditRepo.CountByAction(ctx, "LOGIN", time.Now())

	return &dto.UserStatisticsResponse{
		TotalUsers:      totalUsers,
		ActiveUsers:     activeUsers,
		InactiveUsers:   inactiveUsers,
		AdminUsers:      adminUsers,
		SupervisorUsers: supervisorUsers,
		TimbanganUsers:  timbanganUsers,
		GradingUsers:    gradingUsers,
		TodayLogins:     todayLogins,
	}, nil
}

// GetPasswordPolicy returns the password policy
func (uc *UserManagementUseCase) GetPasswordPolicy() *dto.PasswordPolicyResponse {
	return &dto.PasswordPolicyResponse{
		MinLength:      uc.passwordPolicy.MinLength,
		RequireLetter:  uc.passwordPolicy.RequireLetter,
		RequireNumber:  uc.passwordPolicy.RequireNumber,
		RequireSpecial: uc.passwordPolicy.RequireSpecial,
		RequireUpper:   uc.passwordPolicy.RequireUpper,
		RequireLower:   uc.passwordPolicy.RequireLower,
	}
}

// Private helper methods

func (uc *UserManagementUseCase) validateCreateUserRequest(req *dto.CreateUserRequest) error {
	if req.Username == "" {
		return errors.New("username is required")
	}
	if len(req.Username) < 3 || len(req.Username) > 50 {
		return errors.New("username must be between 3 and 50 characters")
	}
	if err := uc.validatePassword(req.Password); err != nil {
		return err
	}
	if req.FullName == "" || len(req.FullName) > 100 {
		return errors.New("full name is required and must be max 100 characters")
	}
	if !uc.isValidRole(req.Role) {
		return ErrInvalidRole
	}
	return nil
}

func (uc *UserManagementUseCase) validateUpdateUserRequest(req *dto.UpdateUserRequest) error {
	if req.Username == "" {
		return errors.New("username is required")
	}
	if len(req.Username) < 3 || len(req.Username) > 50 {
		return errors.New("username must be between 3 and 50 characters")
	}
	if req.FullName == "" || len(req.FullName) > 100 {
		return errors.New("full name is required and must be max 100 characters")
	}
	if !uc.isValidRole(req.Role) {
		return ErrInvalidRole
	}
	return nil
}

func (uc *UserManagementUseCase) validatePassword(password string) error {
	if len(password) < uc.passwordPolicy.MinLength {
		return ErrPasswordTooShort
	}
	// Add more complex password validation based on policy
	return nil
}

func (uc *UserManagementUseCase) isValidRole(role string) bool {
	validRoles := []string{
		string(entities.RoleAdmin),
		string(entities.RoleSupervisor),
		string(entities.RoleTimbangan),
		string(entities.RoleGrading),
	}
	for _, validRole := range validRoles {
		if role == validRole {
			return true
		}
	}
	return false
}

func (uc *UserManagementUseCase) entityToResponse(user *entities.User) *dto.UserResponse {
	return &dto.UserResponse{
		ID:                 user.ID,
		Username:           user.Username,
		FullName:           user.FullName,
		Email:              user.Email,
		Role:               string(user.Role),
		IsActive:           user.IsActive,
		MustChangePassword: user.MustChangePassword,
		CreatedAt:          user.CreatedAt,
		UpdatedAt:          user.UpdatedAt,
		LastLoginAt:        user.LastLoginAt,
		CreatedBy:          user.CreatedBy,
	}
}