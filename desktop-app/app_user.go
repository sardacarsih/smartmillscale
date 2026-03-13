package main

import (
	"encoding/json"
	"fmt"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	presentatordto "github.com/yourusername/gosmartmillscale/desktop-app/internal/presentation/dto"
)

// User management operations

func (a *App) CreateUser(requestJSON string, creatorID string) (string, error) {
	var req presentatordto.CreateUserRequestDTO
	return a.handler.HandleWithRequest(requestJSON, &req, func() (interface{}, error) {
		return a.application.Container.UserController.CreateUser(&req, creatorID)
	})
}

func (a *App) UpdateUser(requestJSON string, updaterID string) (string, error) {
	// UpdateUser has special logic for extracting userID from updates map
	if a.application == nil || a.application.Container == nil {
		return "", fmt.Errorf("application not initialized")
	}

	var updates map[string]interface{}
	if err := json.Unmarshal([]byte(requestJSON), &updates); err != nil {
		a.logger.Error("Failed to unmarshal UpdateUser request", err, nil)
		return "", fmt.Errorf("failed to unmarshal request: %w", err)
	}

	userID, ok := updates["id"].(string)
	if !ok {
		return "", fmt.Errorf("user ID is required")
	}
	delete(updates, "id")

	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.UpdateUser(userID, updates)
	})
}

func (a *App) GetUserByID(userID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.GetUserByID(userID)
	})
}

func (a *App) GetAllUsers() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.GetAllUsers()
	})
}

func (a *App) GetUserByUsername(username string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.GetUserByUsername(username)
	})
}

func (a *App) SearchUsers(searchRequestJSON string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.SearchUsers(searchRequestJSON)
	})
}

func (a *App) DeleteUser(userID string, deleterID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.DeleteUser(userID, deleterID)
	})
}

func (a *App) ChangePassword(requestJSON string) (string, error) {
	var req struct {
		UserID          string `json:"user_id"`
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	return a.handler.HandleWithRequest(requestJSON, &req, func() (interface{}, error) {
		return a.application.Container.UserController.ChangePassword(req.UserID, req.CurrentPassword, req.NewPassword)
	})
}

func (a *App) ResetPassword(requestJSON string, adminID string) (string, error) {
	var req struct {
		UserID string `json:"user_id"`
	}
	return a.handler.HandleWithRequest(requestJSON, &req, func() (interface{}, error) {
		return a.application.Container.UserController.ResetPassword(req.UserID, adminID)
	})
}

func (a *App) GetUserStatistics() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.GetUserStatistics()
	})
}

func (a *App) GetPasswordPolicy() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.GetPasswordPolicy()
	})
}

// Login authenticates a user and initializes full application services
func (a *App) Login(username, password string) (string, error) {
	// Always generate deviceID on backend for security
	deviceID := getDeviceID()

	// Use core application for authentication
	// This ensures we always have a consistent authentication path regardless of service state
	if a.coreApplication == nil || a.coreApplication.Container == nil {
		result := map[string]interface{}{
			"success": false,
			"error": map[string]interface{}{
				"code":    "APP_NOT_INITIALIZED",
				"message": "Application not initialized",
			},
		}
		resultJSON, err := json.Marshal(result)
		if err != nil {
			a.logger.Error("Failed to marshal error response", err, nil)
			return "", fmt.Errorf("core application not initialized")
		}
		return string(resultJSON), fmt.Errorf("core application not initialized")
	}

	authService := a.coreApplication.Container.AuthService
	if authService == nil {
		result := map[string]interface{}{
			"success": false,
			"error": map[string]interface{}{
				"code":    "AUTH_NOT_AVAILABLE",
				"message": "Authentication service not available",
			},
		}
		resultJSON, err := json.Marshal(result)
		if err != nil {
			a.logger.Error("Failed to marshal error response", err, nil)
			return "", fmt.Errorf("authentication service not available")
		}
		return string(resultJSON), fmt.Errorf("authentication service not available")
	}

	// Authenticate user and create session using core auth service
	session, err := authService.Login(username, password, deviceID)
	if err != nil {
		a.logger.Error("Authentication failed", err, map[string]interface{}{
			"username": username,
		})
		result := map[string]interface{}{
			"success": false,
			"error": map[string]interface{}{
				"code":    "INVALID_CREDENTIALS",
				"message": "Invalid username or password",
			},
		}
		resultJSON, marshalErr := json.Marshal(result)
		if marshalErr != nil {
			a.logger.Error("Failed to marshal error response", marshalErr, nil)
			return "", fmt.Errorf("authentication failed: %w", err)
		}
		return string(resultJSON), fmt.Errorf("authentication failed: %w", err)
	}

	// Initialize full application services for the authenticated user
	if err := a.InitializeAuthenticatedServices(string(session.Role)); err != nil {
		a.logger.Error("Failed to initialize authenticated services", err, map[string]interface{}{
			"username": username,
			"role":     session.Role,
		})
		result := map[string]interface{}{
			"success": false,
			"error": map[string]interface{}{
				"code":    "SERVICE_INIT_FAILED",
				"message": "Failed to initialize application services",
			},
		}
		resultJSON, marshalErr := json.Marshal(result)
		if marshalErr != nil {
			a.logger.Error("Failed to marshal error response", marshalErr, nil)
			return "", fmt.Errorf("failed to initialize services: %w", err)
		}
		return string(resultJSON), fmt.Errorf("failed to initialize services: %w", err)
	}

	// Create user object from session fields for frontend
	userObj := map[string]interface{}{
		"id":       session.UserID.String(),
		"username": session.Username,
		"fullName": session.FullName,
		"role":     string(session.Role),
	}

	// Create structured response format that frontend expects
	result := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"user":    userObj,
			"session": session,
		},
	}

	resultJSON, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("failed to marshal response: %w", err)
	}

	a.logger.Info("User logged in successfully", map[string]interface{}{
		"username": username,
		"role":     session.Role,
	})

	return string(resultJSON), nil
}

// Logout logs out a user session
func (a *App) Logout(sessionJSON string) error {
	a.logger.Info("Processing logout request", nil)

	// Use core application for logout if full services aren't ready
	if !a.servicesReady {
		if a.coreApplication == nil || a.coreApplication.Container == nil {
			return fmt.Errorf("core application not initialized")
		}

		authService := a.coreApplication.Container.AuthService
		if authService == nil {
			return fmt.Errorf("authentication service not available")
		}

		var session auth.UserSession
		if err := json.Unmarshal([]byte(sessionJSON), &session); err != nil {
			return fmt.Errorf("failed to unmarshal session: %w", err)
		}

		// Perform logout in database
		if err := authService.Logout(&session); err != nil {
			a.logger.Error("Failed to logout session", err, nil)
			return err
		}

		a.logger.Info("User logged out successfully", map[string]interface{}{
			"user_id": session.UserID,
		})
		return nil
	}

	// Use full application services if already initialized
	var session auth.UserSession
	err := a.handler.HandleWithRequestVoid(sessionJSON, &session, func() error {
		return a.application.Container.UserController.Logout(&session)
	})

	if err != nil {
		a.logger.Error("Failed to logout", err, nil)
		// Continue with cleanup even if logout fails
	}

	// Reset authenticated services after logout
	if resetErr := a.ResetAuthenticatedServices(); resetErr != nil {
		a.logger.Error("Failed to reset authenticated services", resetErr, nil)
		// Don't return error - logout already completed
	}

	a.logger.Info("User logged out successfully", map[string]interface{}{
		"user_id": session.UserID,
	})

	return err
}

// GetCurrentUser retrieves the current authenticated user from existing session
func (a *App) GetCurrentUser() (string, error) {
	// Use core application for session validation if full services aren't ready
	if !a.servicesReady {
		if a.coreApplication == nil || a.coreApplication.Container == nil {
			return "", fmt.Errorf("core application not initialized")
		}

		authService := a.coreApplication.Container.AuthService
		if authService == nil {
			return "", fmt.Errorf("authentication service not available")
		}

		// For core services mode, we need to check for an existing valid session
		// Since we don't have session management in core services mode, return no user
		result := map[string]interface{}{
			"success": false,
			"error": map[string]interface{}{
				"code":    "SESSION_NOT_FOUND",
				"message": "No active session found",
			},
		}

		resultJSON, err := json.Marshal(result)
		if err != nil {
			return "", fmt.Errorf("failed to marshal result: %w", err)
		}

		return string(resultJSON), nil
	}

	// Use full application services if already initialized
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.GetCurrentUser()
	})
}

// CheckSession validates if a session is still active
func (a *App) CheckSession(sessionJSON string) (string, error) {
	var session auth.UserSession
	return a.handler.HandleWithRequest(sessionJSON, &session, func() (interface{}, error) {
		return a.application.Container.UserController.CheckSession(&session)
	})
}

// RefreshSession refreshes an existing session
func (a *App) RefreshSession(sessionJSON string) (string, error) {
	var session auth.UserSession
	return a.handler.HandleWithRequest(sessionJSON, &session, func() (interface{}, error) {
		return a.application.Container.UserController.RefreshSession(&session)
	})
}

// CheckSetupRequired checks if initial setup is required
func (a *App) CheckSetupRequired() (string, error) {
	// Use core application for setup check if full services aren't ready
	if !a.servicesReady {
		if a.coreApplication == nil || a.coreApplication.Container == nil {
			return "", fmt.Errorf("core application not initialized")
		}

		db := a.coreApplication.Container.DB
		if db == nil {
			return "", fmt.Errorf("database not available")
		}

		// Direct database query to check if users exist
		var count int64
		if err := db.Raw("SELECT COUNT(*) FROM users").Scan(&count).Error; err != nil {
			// Try with GORM model
			if err := db.Table("users").Count(&count).Error; err != nil {
				return "", fmt.Errorf("failed to check user count: %w", err)
			}
		}

		required := count == 0

		result := map[string]interface{}{
			"required": required,
		}

		resultJSON, err := json.Marshal(result)
		if err != nil {
			return "", fmt.Errorf("failed to marshal setup check result: %w", err)
		}

		return string(resultJSON), nil
	}

	// Use full application services if already initialized
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.UserController.CheckSetupRequired()
	})
}
