package database

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserSeeder handles user data seeding
type UserSeeder struct{}

// Name returns the name of this seeder
func (s *UserSeeder) Name() string {
	return "Users"
}

// Dependencies returns the list of seeders that must run before this one
func (s *UserSeeder) Dependencies() []string {
	return []string{} // No dependencies
}

// Run executes the user seeding logic
func (s *UserSeeder) Run(db *gorm.DB) error {
	// Check if users already exist
	var userCount int64
	if err := db.Model(&auth.User{}).Count(&userCount).Error; err != nil {
		return fmt.Errorf("failed to check existing users: %w", err)
	}

	// If users already exist, skip seeding
	if userCount > 0 {
		log.Printf("Found %d existing users, skipping user seeding", userCount)
		return nil
	}

	log.Println("No existing users found, creating seed users...")

	// Get seed users data
	seedUsers := getSeedUsers()
	now := time.Now()

	// Create users
	for _, seedUser := range seedUsers {
		// Hash the password
		passwordHash, err := hashPassword(seedUser.Password)
		if err != nil {
			return fmt.Errorf("failed to hash password for user %s: %w", seedUser.Username, err)
		}

		// Create user record
		user := auth.User{
			ID:                 uuid.New(),
			Username:           seedUser.Username,
			PasswordHash:       passwordHash,
			FullName:           seedUser.FullName,
			Email:              seedUser.Email,
			Role:               seedUser.Role,
			IsActive:           true,
			MustChangePassword: false,
			CreatedAt:          now,
			UpdatedAt:          now,
		}

		// Save user to database
		if err := db.Create(&user).Error; err != nil {
			return fmt.Errorf("failed to create user %s: %w", seedUser.Username, err)
		}

		// Create audit log entry
		details := fmt.Sprintf("Seed user created: %s (%s)", user.Username, user.Role)
		auditLog := auth.AuditLog{
			ID:         uuid.New(),
			UserID:     &user.ID,
			Username:   user.Username,
			Action:     "USER_CREATED",
			EntityType: "user",
			EntityID:   &user.ID,
			Details:    &details,
			Timestamp:  now,
			Success:    true,
		}

		if err := db.Create(&auditLog).Error; err != nil {
			return fmt.Errorf("failed to create audit log for user %s: %w", seedUser.Username, err)
		}

		log.Printf("Created seed user: %s (%s)", seedUser.Username, seedUser.Role)
	}

	log.Printf("Successfully created %d seed users", len(seedUsers))
	return nil
}

// seedUser represents a user to be created during seeding
type seedUser struct {
	Username string
	Password string
	FullName string
	Email    string
	Role     auth.UserRole
}

// getSeedUsers returns the list of users to be created during seeding
func getSeedUsers() []seedUser {
	return []seedUser{
		// Admin users
		{
			Username: "admin01",
			Password: "PassAdmin123!",
			FullName: "Administrator 01",
			Email:    "admin01@smartmillscale.local",
			Role:     auth.RoleAdmin,
		},
		{
			Username: "admin02",
			Password: "PassAdmin123!",
			FullName: "Administrator 02",
			Email:    "admin02@smartmillscale.local",
			Role:     auth.RoleAdmin,
		},
		{
			Username: "admin03",
			Password: "PassAdmin123!",
			FullName: "Administrator 03",
			Email:    "admin03@smartmillscale.local",
			Role:     auth.RoleAdmin,
		},

		// Supervisor users
		{
			Username: "supervisor01",
			Password: "PassSuper123!",
			FullName: "Supervisor 01",
			Email:    "supervisor01@smartmillscale.local",
			Role:     auth.RoleSupervisor,
		},
		{
			Username: "supervisor02",
			Password: "PassSuper123!",
			FullName: "Supervisor 02",
			Email:    "supervisor02@smartmillscale.local",
			Role:     auth.RoleSupervisor,
		},
		{
			Username: "supervisor03",
			Password: "PassSuper123!",
			FullName: "Supervisor 03",
			Email:    "supervisor03@smartmillscale.local",
			Role:     auth.RoleSupervisor,
		},

		// Timbangan (weighing operator) users
		{
			Username: "timbangan01",
			Password: "PassTimbang123",
			FullName: "Operator Timbang 01",
			Email:    "timbangan01@smartmillscale.local",
			Role:     auth.RoleTimbangan,
		},
		{
			Username: "timbangan02",
			Password: "PassTimbang123",
			FullName: "Operator Timbang 02",
			Email:    "timbangan02@smartmillscale.local",
			Role:     auth.RoleTimbangan,
		},
		{
			Username: "timbangan03",
			Password: "PassTimbang123",
			FullName: "Operator Timbang 03",
			Email:    "timbangan03@smartmillscale.local",
			Role:     auth.RoleTimbangan,
		},

		// Grading users
		{
			Username: "grading01",
			Password: "PassGrade123!",
			FullName: "Grading Specialist 01",
			Email:    "grading01@smartmillscale.local",
			Role:     auth.RoleGrading,
		},
		{
			Username: "grading02",
			Password: "PassGrade123!",
			FullName: "Grading Specialist 02",
			Email:    "grading02@smartmillscale.local",
			Role:     auth.RoleGrading,
		},
		{
			Username: "grading03",
			Password: "PassGrade123!",
			FullName: "Grading Specialist 03",
			Email:    "grading03@smartmillscale.local",
			Role:     auth.RoleGrading,
		},
	}
}

// hashPassword creates a bcrypt hash of the password
func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hash), nil
}
