package controllers

import (
	"encoding/json"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	presentatordto "github.com/yourusername/gosmartmillscale/desktop-app/internal/presentation/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/presentation/responses"
)

// AuthServiceInterface defines the contract for authentication services
type AuthServiceInterface interface {
	Login(username, password, deviceID string) (*auth.UserSession, error)
	Logout(session *auth.UserSession) error
	GetAllUsers() ([]auth.User, error)
	CreateUser(username, password, email, fullName string, role auth.UserRole, createdBy string) (*auth.User, error)
	UpdateUser(userID uuid.UUID, updates map[string]interface{}) (*auth.User, error)
	GetUserByID(userID uuid.UUID) (*auth.User, error)
	ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error
	ResetUserPassword(userID uuid.UUID, adminID uuid.UUID) (string, error)
	DeleteUserWithAudit(userID uuid.UUID, adminID uuid.UUID) error
	GetUserStats() (map[string]interface{}, error)
	// API Key Management methods (admin only) - Moved to APIKeyController
	// Add other methods as needed
	// Add other methods as needed
}

// UserController handles Wails API calls for user management
type UserController struct {
	authService AuthServiceInterface
}

// NewUserController creates a new user controller
func NewUserController(authService AuthServiceInterface) *UserController {
	return &UserController{
		authService: authService,
	}
}

// marshalResponse is a helper method to marshal API responses
func (c *UserController) marshalResponse(response *responses.APIResponse) (string, error) {
	responseJSON, err := json.Marshal(response)
	if err != nil {
		// If marshaling fails, return a simple error response
		errorResp := responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to marshal response",
			map[string]interface{}{"marshal_error": err.Error()},
			responses.GenerateRequestID(),
		)
		errorJSON, marshalErr := json.Marshal(errorResp)
		if marshalErr != nil {
			// Last resort: return plain error
			return `{"success":false,"message":"Internal server error"}`, nil
		}
		return string(errorJSON), nil
	}
	return string(responseJSON), nil
}

// Login authenticates a user and returns a session
func (c *UserController) Login(username, password, deviceID string) (*responses.APIResponse, error) {
	log.Printf("🔐 [UserController] Login attempt for username: %s, deviceID: %s", username, deviceID)

	// Validate login request
	loginRequest := &presentatordto.LoginRequestDTO{
		Username: strings.TrimSpace(username),
		Password: password,
		DeviceID: strings.TrimSpace(deviceID),
	}

	log.Printf("🔐 [UserController] Validated login request - Username: '%s', Password length: %d", loginRequest.Username, len(loginRequest.Password))

	if validationErrors := loginRequest.Validate(); len(validationErrors) > 0 {
		log.Printf("❌ [UserController] Validation errors: %v", validationErrors)
		return responses.NewValidationErrorResponse(
			responses.NewValidationErrorDetails(validationErrors),
			responses.GenerateRequestID(),
		), nil
	}

	// Authenticate user
	log.Printf("🔍 [UserController] Calling authService.Login for user: %s", loginRequest.Username)
	session, err := c.authService.Login(loginRequest.Username, loginRequest.Password, loginRequest.DeviceID)
	if err != nil {
		log.Printf("❌ [UserController] Authentication failed for user %s: %v", loginRequest.Username, err)
		// Determine error code based on error type
		errorCode := responses.ErrorCodeInvalidCredentials
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			errorCode = responses.ErrorCodeUserNotFound
		} else if strings.Contains(strings.ToLower(err.Error()), "inactive") {
			errorCode = responses.ErrorCodeUserInactive
		} else if strings.Contains(strings.ToLower(err.Error()), "locked") {
			errorCode = responses.ErrorCodeAccountLocked
		}

		return responses.NewErrorResponse(
			errorCode,
			"Login failed: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	log.Printf("✅ [UserController] Authentication successful for user: %s, Session DeviceID: %s", session.Username, session.DeviceID)

	// Create user DTO from session data (create a minimal user object)
	user := &auth.User{
		ID:          session.UserID,
		Username:    session.Username,
		FullName:    session.FullName,
		Role:        session.Role,
		IsActive:    true,
		LastLoginAt: &session.LoginTime,
	}

	log.Printf("🔍 [UserController] Created user DTO - ID: %s, Username: %s, Role: %s", user.ID.String(), user.Username, user.Role)

	// Create login response DTO
	loginResponse := presentatordto.NewLoginResponseDTO(user, session)
	log.Printf("🔍 [UserController] Created login response DTO")

	// Return success response
	return responses.NewSuccessResponse(
		"Login successful",
		loginResponse,
		session.DeviceID,
	), nil
}

// CreateUser creates a new user
func (c *UserController) CreateUser(req *presentatordto.CreateUserRequestDTO, creatorID string) (*responses.APIResponse, error) {
	// Validate request
	if validationErrors := req.Validate(); len(validationErrors) > 0 {
		return responses.NewValidationErrorResponse(
			responses.NewValidationErrorDetails(validationErrors),
			responses.GenerateRequestID(),
		), nil
	}

	// Convert role string to UserRole
	role := auth.UserRole(req.Role)

	user, err := c.authService.CreateUser(req.Username, req.Password, req.Email, req.FullName, role, creatorID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to create user: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"User created successfully",
		user,
		"",
	), nil
}

// UpdateUser updates an existing user
func (c *UserController) UpdateUser(userID string, updates map[string]interface{}) (*responses.APIResponse, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid user ID",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	user, err := c.authService.UpdateUser(uid, updates)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to update user: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"User updated successfully",
		user,
		"",
	), nil
}

// GetUserByID retrieves a user by ID
func (c *UserController) GetUserByID(userID string) (*responses.APIResponse, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid user ID",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	user, err := c.authService.GetUserByID(uid)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeUserNotFound,
			"User not found: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"User retrieved successfully",
		user,
		"",
	), nil
}

// GetAllUsers retrieves all users
func (c *UserController) GetAllUsers() (*responses.APIResponse, error) {
	users, err := c.authService.GetAllUsers()
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to retrieve users: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"Users retrieved successfully",
		users,
		"",
	), nil
}

// DeleteUser deletes a user
func (c *UserController) DeleteUser(userID string, deleterID string) (*responses.APIResponse, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid user ID",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	adminID, err := uuid.Parse(deleterID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid admin ID",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	if err := c.authService.DeleteUserWithAudit(uid, adminID); err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to delete user: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"User deleted successfully",
		nil,
		"",
	), nil
}

// ChangePassword changes a user's password
func (c *UserController) ChangePassword(userID string, oldPassword, newPassword string) (*responses.APIResponse, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid user ID",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	if err := c.authService.ChangePassword(uid, oldPassword, newPassword); err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to change password: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"Password changed successfully",
		nil,
		"",
	), nil
}

// ResetPassword resets a user's password
func (c *UserController) ResetPassword(userID string, adminID string) (*responses.APIResponse, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid user ID",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	aid, err := uuid.Parse(adminID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid admin ID",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	newPassword, err := c.authService.ResetUserPassword(uid, aid)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to reset password: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"Password reset successfully",
		map[string]string{"newPassword": newPassword},
		"",
	), nil
}

// GetUserStatistics retrieves user statistics
func (c *UserController) GetUserStatistics() (*responses.APIResponse, error) {
	stats, err := c.authService.GetUserStats()
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to retrieve user statistics: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"User statistics retrieved successfully",
		stats,
		"",
	), nil
}

// GetUserByUsername retrieves a user by username
func (c *UserController) GetUserByUsername(username string) (*responses.APIResponse, error) {
	return responses.NewErrorResponse(
		responses.ErrorCodeInternalServer,
		"GetUserByUsername method not implemented",
		nil,
		responses.GenerateRequestID(),
	), nil
}

// SearchUsers searches for users
func (c *UserController) SearchUsers(searchRequestJSON string) (*responses.APIResponse, error) {
	return responses.NewErrorResponse(
		responses.ErrorCodeInternalServer,
		"SearchUsers method not implemented",
		nil,
		responses.GenerateRequestID(),
	), nil
}

// GetPasswordPolicy retrieves password policy
func (c *UserController) GetPasswordPolicy() (*responses.APIResponse, error) {
	return responses.NewErrorResponse(
		responses.ErrorCodeInternalServer,
		"GetPasswordPolicy method not implemented",
		nil,
		responses.GenerateRequestID(),
	), nil
}

// Logout logs out a user session
func (c *UserController) Logout(session *auth.UserSession) error {
	return c.authService.Logout(session)
}

// CheckSession validates if a session is still active
func (c *UserController) CheckSession(session *auth.UserSession) (*responses.APIResponse, error) {
	// Check if session is expired or inactive
	if session.IsExpired() {
		return responses.NewErrorResponse(
			responses.ErrorCodeSessionExpired,
			"Session has expired",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	if session.IsInactive() {
		return responses.NewErrorResponse(
			responses.ErrorCodeSessionInvalid,
			"Session is inactive",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	// Update activity and return updated session
	session.UpdateActivity()

	// Create user DTO from session data
	user := &auth.User{
		ID:          session.UserID,
		Username:    session.Username,
		FullName:    session.FullName,
		Role:        session.Role,
		IsActive:    true,
		LastLoginAt: &session.LoginTime,
	}

	// Create session response DTO
	sessionResponse := presentatordto.NewLoginResponseDTO(user, session)

	// Return success response in proper format
	return responses.NewSuccessResponse(
		"Session is valid",
		sessionResponse,
		session.DeviceID,
	), nil
}

// RefreshSession refreshes an existing session
func (c *UserController) RefreshSession(session *auth.UserSession) (*responses.APIResponse, error) {
	// Check if session is expired or inactive
	if session.IsExpired() {
		return responses.NewErrorResponse(
			responses.ErrorCodeSessionExpired,
			"Session has expired and cannot be refreshed",
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	// Refresh session with new timestamps
	session.UpdateActivity()
	// Note: You might want to extend session expiry here

	// Create user DTO from refreshed session data
	user := &auth.User{
		ID:          session.UserID,
		Username:    session.Username,
		FullName:    session.FullName,
		Role:        session.Role,
		IsActive:    true,
		LastLoginAt: &session.LoginTime,
	}

	// Create session response DTO
	sessionResponse := presentatordto.NewLoginResponseDTO(user, session)

	// Return success response in proper format
	return responses.NewSuccessResponse(
		"Session refreshed successfully",
		sessionResponse,
		session.DeviceID,
	), nil
}

// CheckSetupRequired checks if initial setup is required
func (c *UserController) CheckSetupRequired() (*responses.APIResponse, error) {
	// Check if any users exist
	users, err := c.authService.GetAllUsers()
	if err != nil {
		return nil, err
	}

	setupRequired := len(users) == 0

	response := map[string]interface{}{
		"setupRequired": setupRequired,
		"userCount":     len(users),
	}

	return responses.NewSuccessResponse(
		"Setup check successful",
		response,
		"",
	), nil
}

// GetCurrentUser retrieves the current authenticated user
// Note: In stateless API design, this would typically require a token or session parameter
// For now, this method returns a not authenticated error since session management is handled at app level
func (c *UserController) GetCurrentUser() (*responses.APIResponse, error) {
	return responses.NewErrorResponse(
		responses.ErrorCodeNotAuthenticated,
		"Session not found - user must authenticate first",
		map[string]interface{}{
			"code":    "SESSION_NOT_FOUND",
			"message": "No active session found",
		},
		responses.GenerateRequestID(),
	), nil
}
