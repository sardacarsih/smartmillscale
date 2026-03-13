package controllers

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/presentation/responses"
)

// MockAuthService is a mock for the AuthService
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Login(username, password, deviceID string) (*auth.UserSession, error) {
	args := m.Called(username, password, deviceID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auth.UserSession), args.Error(1)
}

func (m *MockAuthService) Logout(session *auth.UserSession) error {
	args := m.Called(session)
	return args.Error(0)
}

func (m *MockAuthService) CheckSession(session *auth.UserSession) (*auth.UserSession, error) {
	args := m.Called(session)
	return args.Get(0).(*auth.UserSession), args.Error(1)
}

func (m *MockAuthService) RefreshSession(session *auth.UserSession) (*auth.UserSession, error) {
	args := m.Called(session)
	return args.Get(0).(*auth.UserSession), args.Error(1)
}

func (m *MockAuthService) GetAllUsers() ([]auth.User, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]auth.User), args.Error(1)
}

func (m *MockAuthService) CreateUser(username, password, email, fullName string, role auth.UserRole, createdBy string) (*auth.User, error) {
	args := m.Called(username, password, email, fullName, role, createdBy)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auth.User), args.Error(1)
}

func (m *MockAuthService) UpdateUser(userID uuid.UUID, updates map[string]interface{}) (*auth.User, error) {
	args := m.Called(userID, updates)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auth.User), args.Error(1)
}

func (m *MockAuthService) GetUserByID(userID uuid.UUID) (*auth.User, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auth.User), args.Error(1)
}

func (m *MockAuthService) ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error {
	args := m.Called(userID, oldPassword, newPassword)
	return args.Error(0)
}

func (m *MockAuthService) ResetUserPassword(userID uuid.UUID, adminID uuid.UUID) (string, error) {
	args := m.Called(userID, adminID)
	return args.String(0), args.Error(1)
}

func (m *MockAuthService) DeleteUserWithAudit(userID uuid.UUID, adminID uuid.UUID) error {
	args := m.Called(userID, adminID)
	return args.Error(0)
}

func (m *MockAuthService) GetUserStats() (map[string]interface{}, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func TestUserController_Login_Success(t *testing.T) {
	// Setup mocks
	mockAuthService := &MockAuthService{}
	controller := NewUserController(mockAuthService)

	// Create test session
	session := &auth.UserSession{
		UserID:       uuid.New(),
		Username:     "admin",
		Role:         auth.RoleAdmin,
		FullName:     "Administrator",
		LoginTime:    time.Now(),
		LastActivity: time.Now(),
		DeviceID:     "device-001",
	}

	// Mock successful authentication
	mockAuthService.On("Login", "admin", "admin123", "device-001").Return(session, nil)

	// Execute login
	response, err := controller.Login("admin", "admin123", "device-001")

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, response)

	// Verify response structure
	assert.True(t, response.Success)
	assert.Equal(t, "Login successful", response.Message)
	assert.NotNil(t, response.Data)
	assert.NotNil(t, response.Meta)
	assert.Equal(t, "device-001", response.Meta.DeviceID)

	// Verify mock was called
	mockAuthService.AssertExpectations(t)
}

func TestUserController_Login_ValidationFailure(t *testing.T) {
	// Setup mocks
	mockAuthService := &MockAuthService{}
	controller := NewUserController(mockAuthService)

	// Execute login with empty username
	response, err := controller.Login("", "admin123", "device-001")

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, response)

	// Verify response structure for validation error
	assert.False(t, response.Success)
	assert.Equal(t, "Input validation failed", response.Message)
	assert.NotNil(t, response.Error)
	assert.Equal(t, responses.ErrorCodeValidationFailed, response.Error.Code)

	// AuthService should not be called for validation failures
	mockAuthService.AssertNotCalled(t, "Login")
}

func TestUserController_Login_AuthenticationFailure(t *testing.T) {
	// Setup mocks
	mockAuthService := &MockAuthService{}
	controller := NewUserController(mockAuthService)

	// Mock authentication failure
	mockAuthService.On("Login", "admin", "wrongpassword", "device-001").Return(nil, assert.AnError)

	// Execute login
	response, err := controller.Login("admin", "wrongpassword", "device-001")

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, response)

	// Verify response structure for authentication error
	assert.False(t, response.Success)
	assert.Contains(t, response.Message, "Login failed")
	assert.NotNil(t, response.Error)
	assert.Equal(t, responses.ErrorCodeInvalidCredentials, response.Error.Code)

	// Verify mock was called
	mockAuthService.AssertExpectations(t)
}

func TestUserController_Login_UserNotFound(t *testing.T) {
	// Setup mocks
	mockAuthService := &MockAuthService{}
	controller := NewUserController(mockAuthService)

	// Mock user not found error
	mockAuthService.On("Login", "nonexistent", "password123", "device-001").Return(nil, assert.AnError)

	// Execute login
	response, err := controller.Login("nonexistent", "password123", "device-001")

	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, response)

	// Verify response structure
	assert.False(t, response.Success)
	assert.NotNil(t, response.Error)

	// Verify mock was called
	mockAuthService.AssertExpectations(t)
}

// Benchmark the login process
func BenchmarkUserController_Login(b *testing.B) {
	// Setup mocks
	mockAuthService := &MockAuthService{}
	controller := NewUserController(mockAuthService)

	// Create test session
	session := &auth.UserSession{
		UserID:       uuid.New(),
		Username:     "benchmarkuser",
		Role:         auth.RoleTimbangan,
		FullName:     "Benchmark User",
		LoginTime:    time.Now(),
		LastActivity: time.Now(),
		DeviceID:     "device-benchmark",
	}

	// Mock successful authentication
	mockAuthService.On("Login", "benchmarkuser", "password123", "device-benchmark").Return(session, nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := controller.Login("benchmarkuser", "password123", "device-benchmark")
		if err != nil {
			b.Fatalf("Login failed: %v", err)
		}
	}
}
