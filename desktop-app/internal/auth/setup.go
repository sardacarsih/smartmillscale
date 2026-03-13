package auth

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SetupConfig holds configuration for initial setup
type SetupConfig struct {
	AdminUsername string
	AdminPassword string
	AdminEmail    string
	CompanyName   string
	Location      string
}

// SetupService handles initial application setup
type SetupService struct {
	db          *gorm.DB
	authService *AuthService
	dataDir     string
}

// NewSetupService creates a new setup service
func NewSetupService(db *gorm.DB, authService *AuthService, dataDir string) *SetupService {
	return &SetupService{
		db:          db,
		authService: authService,
		dataDir:     dataDir,
	}
}

// CheckSetupRequired checks if initial setup is required
func (s *SetupService) CheckSetupRequired() (bool, error) {
	// Check if there are any users in the database
	var count int64
	if err := s.db.Model(&User{}).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check user count: %w", err)
	}

	return count == 0, nil
}

// CreateDefaultUser creates a default admin user with standard credentials
func (s *SetupService) CreateDefaultUser() error {
	// Check if setup is actually required
	required, err := s.CheckSetupRequired()
	if err != nil {
		return fmt.Errorf("gagal memeriksa status setup: %w", err)
	}

	if !required {
		return fmt.Errorf("setup sudah dilakukan sebelumnya")
	}

	// Default credentials
	defaultUsername := "admin"
	defaultPassword := "Admin123!"
	defaultEmail := "admin@smartmill.com"
	defaultFullName := "Default Administrator"

	// Hash default password
	hash, err := HashPassword(defaultPassword)
	if err != nil {
		return fmt.Errorf("gagal hash password default: %w", err)
	}

	// Create default admin user
	admin := User{
		ID:                 uuid.New(),
		Username:           defaultUsername,
		PasswordHash:       hash,
		FullName:           defaultFullName,
		Email:              defaultEmail,
		Role:               RoleAdmin,
		IsActive:           true,
		MustChangePassword: true, // Force password change on first login
	}

	if err := s.db.Create(&admin).Error; err != nil {
		return fmt.Errorf("gagal membuat admin user default: %w", err)
	}

	// Create device info file with default values
	deviceInfoPath := filepath.Join(s.dataDir, "device.json")
	deviceInfo := fmt.Sprintf(`{
		"companyName": "Smart Mill Scale",
		"location": "Default Location",
		"setupCompleted": true,
		"setupAt": "%s",
		"defaultCredentials": true
	}`, "now")

	if err := os.WriteFile(deviceInfoPath, []byte(deviceInfo), 0644); err != nil {
		return fmt.Errorf("gagal menyimpan device info: %w", err)
	}

	// Log default user creation
	s.authService.LogAuditEvent(&admin.ID, admin.Username, "DEFAULT_USER_CREATED", "system", nil, true, "Default admin user created with credentials", "")

	return nil
}

// CompleteSetup completes the initial application setup
func (s *SetupService) CompleteSetup(config SetupConfig) error {
	// Validate inputs
	if config.AdminUsername == "" {
		return fmt.Errorf("admin username tidak boleh kosong")
	}
	if config.AdminPassword == "" {
		return fmt.Errorf("admin password tidak boleh kosong")
	}
	if config.CompanyName == "" {
		return fmt.Errorf("nama perusahaan tidak boleh kosong")
	}

	// Validate password strength
	if err := ValidatePasswordStrength(config.AdminPassword); err != nil {
		return fmt.Errorf("password admin tidak valid: %w", err)
	}

	// Check if setup is actually required
	required, err := s.CheckSetupRequired()
	if err != nil {
		return fmt.Errorf("gagal memeriksa status setup: %w", err)
	}

	if !required {
		return fmt.Errorf("setup sudah dilakukan sebelumnya")
	}

	// Hash admin password
	hash, err := HashPassword(config.AdminPassword)
	if err != nil {
		return fmt.Errorf("gagal hash password admin: %w", err)
	}

	// Create admin user
	admin := User{
		ID:                 uuid.New(),
		Username:           config.AdminUsername,
		PasswordHash:       hash,
		FullName:           "System Administrator",
		Email:              config.AdminEmail,
		Role:               RoleAdmin,
		IsActive:           true,
		MustChangePassword: false,
	}

	if err := s.db.Create(&admin).Error; err != nil {
		return fmt.Errorf("gagal membuat admin user: %w", err)
	}

	// Create device info file
	deviceInfoPath := filepath.Join(s.dataDir, "device.json")
	deviceInfo := fmt.Sprintf(`{
		"companyName": "%s",
		"location": "%s",
		"setupCompleted": true,
		"setupAt": "%s"
	}`, config.CompanyName, config.Location, "now")

	if err := os.WriteFile(deviceInfoPath, []byte(deviceInfo), 0644); err != nil {
		return fmt.Errorf("gagal menyimpan device info: %w", err)
	}

	// Log setup completion
	s.authService.LogAuditEvent(&admin.ID, admin.Username, "SETUP_COMPLETED", "system", nil, true, fmt.Sprintf("Initial setup completed for company: %s", config.CompanyName), "")

	return nil
}

// GetSetupInfo returns current setup information
func (s *SetupService) GetSetupInfo() (map[string]interface{}, error) {
	// Check if setup is required
	required, err := s.CheckSetupRequired()
	if err != nil {
		return nil, fmt.Errorf("gagal memeriksa status setup: %w", err)
	}

	info := map[string]interface{}{
		"setupRequired": required,
		"setupComplete": !required,
	}

	if !required {
		// Get admin user info
		var admin User
		if err := s.db.Where("role = ?", RoleAdmin).First(&admin).Error; err == nil {
			info["adminUsername"] = admin.Username
			info["adminCreated"] = admin.CreatedAt
		}

		// Read device info file if it exists
		deviceInfoPath := filepath.Join(s.dataDir, "device.json")
		if data, err := os.ReadFile(deviceInfoPath); err == nil {
			info["deviceInfo"] = string(data)
		}
	}

	return info, nil
}