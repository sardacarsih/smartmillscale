package auth

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuthService handles authentication and authorization
type AuthService struct {
	db *gorm.DB
}

// NewAuthService creates a new authentication service
func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

// Login authenticates a user and returns a session
func (s *AuthService) Login(username, password, deviceID string) (*UserSession, error) {
	// Validate inputs
	username = strings.TrimSpace(username)
	if username == "" {
		return nil, errors.New("username tidak boleh kosong")
	}

	if password == "" {
		return nil, errors.New("password tidak boleh kosong")
	}

	// Validate username format (prevent SQL injection)
	if !IsValidUsername(username) {
		s.LogAuditEvent(nil, username, "LOGIN_FAILED", "", nil, false, "invalid username format", deviceID)
		return nil, errors.New("username tidak valid")
	}

	// Find user
	var user User
	err := s.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Log failed attempt (don't reveal if user exists or not)
			s.LogAuditEvent(nil, username, "LOGIN_FAILED", "", nil, false, "user not found", deviceID)
			return nil, errors.New("username atau password salah")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		s.LogAuditEvent(&user.ID, username, "LOGIN_FAILED", "", nil, false, "user is inactive", deviceID)
		return nil, errors.New("akun Anda tidak aktif. Hubungi administrator")
	}

	// Verify password
	if !VerifyPassword(password, user.PasswordHash) {
		// Log failed attempt
		s.LogAuditEvent(&user.ID, username, "LOGIN_FAILED", "", nil, false, "invalid password", deviceID)
		return nil, errors.New("username atau password salah")
	}

	// Update last login timestamp
	now := time.Now()
	user.LastLoginAt = &now
	if err := s.db.Save(&user).Error; err != nil {
		// Don't fail login if we can't update timestamp
		fmt.Printf("Warning: failed to update last login time: %v\n", err)
	}

	// Log successful login
	s.LogAuditEvent(&user.ID, username, "LOGIN_SUCCESS", "", nil, true, "", deviceID)

	// Create session
	session := &UserSession{
		UserID:       user.ID,
		Username:     user.Username,
		Role:         user.Role,
		FullName:     user.FullName,
		LoginTime:    now,
		LastActivity: now,
		DeviceID:     deviceID,
	}

	return session, nil
}

// Logout ends a user session
func (s *AuthService) Logout(session *UserSession) error {
	if session == nil {
		return errors.New("tidak ada sesi aktif")
	}

	// Log logout
	s.LogAuditEvent(&session.UserID, session.Username, "LOGOUT", "", nil, true, "", session.DeviceID)

	return nil
}

// ChangePassword changes a user's password
func (s *AuthService) ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error {
	// Find user
	var user User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return fmt.Errorf("user tidak ditemukan: %w", err)
	}

	// Verify old password
	if !VerifyPassword(oldPassword, user.PasswordHash) {
		s.LogAuditEvent(&userID, user.Username, "PASSWORD_CHANGE_FAILED", "", nil, false, "incorrect old password", "")
		return errors.New("password lama salah")
	}

	// Validate new password strength
	if err := ValidatePasswordStrength(newPassword); err != nil {
		return fmt.Errorf("password baru tidak valid: %w", err)
	}

	// Hash new password
	hash, err := HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("gagal hash password: %w", err)
	}

	// Update password
	user.PasswordHash = hash
	user.MustChangePassword = false
	if err := s.db.Save(&user).Error; err != nil {
		return fmt.Errorf("gagal update password: %w", err)
	}

	// Log password change
	s.LogAuditEvent(&userID, user.Username, "PASSWORD_CHANGED", "", nil, true, "", "")

	return nil
}

// GetAllUsers returns all users (admin only)
func (s *AuthService) GetAllUsers() ([]User, error) {
	var users []User
	if err := s.db.Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil daftar user: %w", err)
	}
	return users, nil
}

// GetUserByID retrieves a user by ID (admin only)
func (s *AuthService) GetUserByID(userID uuid.UUID) (*User, error) {
	var user User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("user tidak ditemukan: %w", err)
	}
	return &user, nil
}

// CreateUser creates a new user with email and password (admin only)
func (s *AuthService) CreateUser(username, password, email, fullName string, role UserRole, createdBy string) (*User, error) {
	log.Printf("=== CREATE USER START ===")
	log.Printf("Creating user: username=%s, role=%s, createdBy=%s", username, role, createdBy)

	// Check database connection
	if s.db == nil {
		log.Printf("❌ ERROR: Database connection is nil")
		return nil, errors.New("database connection is nil")
	}

	// Test database connection
	var testCount int64
	if err := s.db.Model(&User{}).Count(&testCount).Error; err != nil {
		log.Printf("❌ ERROR: Database connection test failed: %v", err)
		return nil, fmt.Errorf("database connection failed: %w", err)
	}
	log.Printf("✅ Database connection OK, current user count: %d", testCount)

	// Validate inputs
	username = strings.TrimSpace(username)
	fullName = strings.TrimSpace(fullName)
	email = strings.TrimSpace(email)

	log.Printf("Validated inputs: username='%s', fullName='%s', email='%s'", username, fullName, email)

	if username == "" {
		log.Printf("❌ ERROR: Username is empty")
		return nil, errors.New("username tidak boleh kosong")
	}

	if fullName == "" {
		log.Printf("❌ ERROR: Full name is empty")
		return nil, errors.New("nama lengkap tidak boleh kosong")
	}

	if password == "" {
		log.Printf("❌ ERROR: Password is empty")
		return nil, errors.New("password tidak boleh kosong")
	}

	if !IsValidUsername(username) {
		log.Printf("❌ ERROR: Invalid username format")
		return nil, errors.New("username hanya boleh mengandung huruf, angka, underscore, dan dash")
	}

	// Validate role
	validRoles := map[UserRole]bool{
		RoleAdmin:      true,
		RoleSupervisor: true,
		RoleTimbangan:  true,
		RoleGrading:    true,
	}
	if !validRoles[role] {
		log.Printf("❌ ERROR: Invalid role: %v", role)
		return nil, errors.New("role tidak valid")
	}

	// Check if username already exists
	log.Printf("Checking if username '%s' already exists...", username)
	var count int64
	if err := s.db.Model(&User{}).Where("username = ?", username).Count(&count).Error; err != nil {
		log.Printf("❌ ERROR: Failed to check username existence: %v", err)
		return nil, fmt.Errorf("gagal memeriksa username: %w", err)
	}
	log.Printf("Username count: %d", count)
	if count > 0 {
		log.Printf("❌ ERROR: Username already exists")
		return nil, errors.New("username sudah digunakan")
	}

	// Hash password
	log.Printf("Hashing password...")
	hash, err := HashPassword(password)
	if err != nil {
		log.Printf("❌ ERROR: Failed to hash password: %v", err)
		return nil, fmt.Errorf("gagal hash password: %w", err)
	}
	log.Printf("✅ Password hashed successfully")

	// Create user
	log.Printf("Creating user record...")
	user := User{
		ID:                 uuid.New(),
		Username:           username,
		PasswordHash:       hash,
		FullName:           fullName,
		Email:              email,
		Role:               role,
		IsActive:           true,
		MustChangePassword: true, // Force password change on first login
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	log.Printf("User object created: ID=%s, Username=%s, Role=%s", user.ID, user.Username, user.Role)

	// Use explicit transaction
	log.Printf("Starting database transaction...")
	tx := s.db.Begin()
	if tx.Error != nil {
		log.Printf("❌ ERROR: Failed to start transaction: %v", tx.Error)
		return nil, fmt.Errorf("gagal memulai transaksi: %w", tx.Error)
	}

	if err := tx.Create(&user).Error; err != nil {
		log.Printf("❌ ERROR: Failed to create user in database: %v", err)
		tx.Rollback()
		return nil, fmt.Errorf("gagal membuat user: %w", err)
	}
	log.Printf("✅ User created in database with ID: %s", user.ID)

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("❌ ERROR: Failed to commit transaction: %v", err)
		return nil, fmt.Errorf("gagal menyimpan perubahan: %w", err)
	}
	log.Printf("✅ Transaction committed successfully")

	// Verify user was actually saved
	log.Printf("Verifying user was saved to database...")
	var savedUser User
	if err := s.db.First(&savedUser, "id = ?", user.ID).Error; err != nil {
		log.Printf("❌ ERROR: Failed to verify user was saved: %v", err)
		return nil, fmt.Errorf("gagal memverifikasi user tersimpan: %w", err)
	}
	log.Printf("✅ User verification successful: found user %s", savedUser.Username)

	// Log user creation
	log.Printf("Logging audit event...")
	s.LogAuditEvent(nil, createdBy, "USER_CREATED", "user", &user.ID, true, fmt.Sprintf("created user: %s", username), "")

	// Get final user count
	var finalCount int64
	s.db.Model(&User{}).Count(&finalCount)
	log.Printf("=== CREATE USER COMPLETE ===")
	log.Printf("Final user count: %d (was %d)", finalCount, testCount)
	log.Printf("Created user: ID=%s, Username=%s, Email=%s, Role=%s", savedUser.ID, savedUser.Username, savedUser.Email, savedUser.Role)

	return &savedUser, nil
}

// CreateUserWithoutPassword creates a new user with auto-generated password (admin only)
func (s *AuthService) CreateUserWithoutPassword(username, fullName string, role UserRole, createdBy uuid.UUID) (*User, string, error) {
	// Validate inputs
	username = strings.TrimSpace(username)
	fullName = strings.TrimSpace(fullName)

	if username == "" {
		return nil, "", errors.New("username tidak boleh kosong")
	}

	if fullName == "" {
		return nil, "", errors.New("nama lengkap tidak boleh kosong")
	}

	if !IsValidUsername(username) {
		return nil, "", errors.New("username hanya boleh mengandung huruf, angka, underscore, dan dash")
	}

	// Validate role
	validRoles := map[UserRole]bool{
		RoleAdmin:      true,
		RoleSupervisor: true,
		RoleTimbangan:  true,
		RoleGrading:    true,
	}
	if !validRoles[role] {
		return nil, "", errors.New("role tidak valid")
	}

	// Check if username already exists
	var count int64
	s.db.Model(&User{}).Where("username = ?", username).Count(&count)
	if count > 0 {
		return nil, "", errors.New("username sudah digunakan")
	}

	// Generate random password
	password, err := GenerateRandomPassword(12)
	if err != nil {
		return nil, "", fmt.Errorf("gagal generate password: %w", err)
	}

	// Hash password
	hash, err := HashPassword(password)
	if err != nil {
		return nil, "", fmt.Errorf("gagal hash password: %w", err)
	}

	// Create user
	user := User{
		ID:                 uuid.New(),
		Username:           username,
		PasswordHash:       hash,
		FullName:           fullName,
		Role:               role,
		IsActive:           true,
		MustChangePassword: true, // Force password change on first login
		CreatedBy:          &createdBy,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, "", fmt.Errorf("gagal membuat user: %w", err)
	}

	// Log user creation
	s.LogAuditEvent(&createdBy, "", "USER_CREATED", "user", &user.ID, true, fmt.Sprintf("created user: %s", username), "")

	return &user, password, nil
}

// ResetUserPassword resets a user's password to a new random password (admin only)
func (s *AuthService) ResetUserPassword(userID uuid.UUID, adminID uuid.UUID) (string, error) {
	// Find user
	var user User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return "", fmt.Errorf("user tidak ditemukan: %w", err)
	}

	// Generate new random password
	newPassword, err := GenerateRandomPassword(12)
	if err != nil {
		return "", fmt.Errorf("gagal generate password: %w", err)
	}

	// Hash password
	hash, err := HashPassword(newPassword)
	if err != nil {
		return "", fmt.Errorf("gagal hash password: %w", err)
	}

	// Update password
	user.PasswordHash = hash
	user.MustChangePassword = true // Force password change on next login
	if err := s.db.Save(&user).Error; err != nil {
		return "", fmt.Errorf("gagal reset password: %w", err)
	}

	// Log password reset
	s.LogAuditEvent(&adminID, user.Username, "PASSWORD_RESET", "user", &userID, true, fmt.Sprintf("password reset for user: %s", user.Username), "")

	return newPassword, nil
}

// UpdateUser updates user information (admin only)
func (s *AuthService) UpdateUser(userID uuid.UUID, updates map[string]interface{}) (*User, error) {
	// Find user
	var user User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("user tidak ditemukan: %w", err)
	}

	// Apply updates
	if fullName, ok := updates["full_name"].(string); ok {
		user.FullName = strings.TrimSpace(fullName)
	}

	if email, ok := updates["email"].(string); ok {
		user.Email = strings.TrimSpace(email)
	}

	if role, ok := updates["role"].(UserRole); ok {
		user.Role = role
	}

	if isActive, ok := updates["is_active"].(bool); ok {
		user.IsActive = isActive
	}

	if err := s.db.Save(&user).Error; err != nil {
		return nil, fmt.Errorf("gagal update user: %w", err)
	}

	return &user, nil
}

// UpdateUserLegacy updates user information (admin only) - legacy method
func (s *AuthService) UpdateUserLegacy(userID uuid.UUID, fullName string, role UserRole, isActive bool, adminID uuid.UUID) error {
	// Find user
	var user User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return fmt.Errorf("user tidak ditemukan: %w", err)
	}

	// Update fields
	user.FullName = strings.TrimSpace(fullName)
	user.Role = role
	user.IsActive = isActive

	if err := s.db.Save(&user).Error; err != nil {
		return fmt.Errorf("gagal update user: %w", err)
	}

	// Log user update
	s.LogAuditEvent(&adminID, user.Username, "USER_UPDATED", "user", &userID, true, fmt.Sprintf("updated user: %s", user.Username), "")

	return nil
}

// UpdateOwnProfile allows a user to update their own profile information (self-service)
// Users can only update their full name and email, not role or active status
func (s *AuthService) UpdateOwnProfile(userID uuid.UUID, fullName, email string) (*User, error) {
	// Find user
	var user User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("user tidak ditemukan: %w", err)
	}

	// Validate and update full name
	if fullName != "" {
		fullName = strings.TrimSpace(fullName)
		if fullName == "" {
			return nil, errors.New("nama lengkap tidak boleh kosong")
		}
		user.FullName = fullName
	}

	// Validate and update email
	if email != "" {
		email = strings.TrimSpace(email)
		// Basic email validation
		if email != "" && !strings.Contains(email, "@") {
			return nil, errors.New("format email tidak valid")
		}

		// Check email uniqueness (if changing email)
		if email != user.Email {
			var count int64
			if err := s.db.Model(&User{}).Where("email = ? AND id != ?", email, userID).Count(&count).Error; err != nil {
				return nil, fmt.Errorf("gagal validasi email: %w", err)
			}
			if count > 0 {
				return nil, errors.New("email sudah digunakan oleh user lain")
			}
		}
		user.Email = email
	}

	// Save changes
	if err := s.db.Save(&user).Error; err != nil {
		return nil, fmt.Errorf("gagal update profil: %w", err)
	}

	// Log profile update
	s.LogAuditEvent(&userID, user.Username, "PROFILE_UPDATED", "user", &userID, true, "updated own profile", "")

	return &user, nil
}

// DeleteUser soft deletes a user by setting IsActive to false (admin only)
func (s *AuthService) DeleteUser(userID uuid.UUID) error {
	// Find user
	var user User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return fmt.Errorf("user tidak ditemukan: %w", err)
	}

	// Prevent deleting the last admin
	if user.Role == RoleAdmin {
		var adminCount int64
		s.db.Model(&User{}).Where("role = ? AND is_active = true", RoleAdmin).Count(&adminCount)
		if adminCount <= 1 {
			return errors.New("tidak bisa menghapus admin terakhir")
		}
	}

	// Soft delete by setting IsActive to false
	user.IsActive = false
	if err := s.db.Save(&user).Error; err != nil {
		return fmt.Errorf("gagal menghapus user: %w", err)
	}

	return nil
}

// DeleteUserWithAudit soft deletes a user with audit logging (admin only)
func (s *AuthService) DeleteUserWithAudit(userID uuid.UUID, adminID uuid.UUID) error {
	// Find user
	var user User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return fmt.Errorf("user tidak ditemukan: %w", err)
	}

	// Prevent deleting the last admin
	if user.Role == RoleAdmin {
		var adminCount int64
		s.db.Model(&User{}).Where("role = ? AND is_active = true", RoleAdmin).Count(&adminCount)
		if adminCount <= 1 {
			return errors.New("tidak bisa menghapus admin terakhir")
		}
	}

	// Soft delete by setting IsActive to false
	user.IsActive = false
	if err := s.db.Save(&user).Error; err != nil {
		return fmt.Errorf("gagal menghapus user: %w", err)
	}

	// Log user deletion
	s.LogAuditEvent(&adminID, user.Username, "USER_DELETED", "user", &userID, true, fmt.Sprintf("deleted user: %s", user.Username), "")

	return nil
}

// ListUsers returns all users (admin only)
func (s *AuthService) ListUsers() ([]User, error) {
	var users []User
	if err := s.db.Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil daftar user: %w", err)
	}
	return users, nil
}

// UserSearchRequest represents search parameters for user queries
type UserSearchRequest struct {
	Page      int    `json:"page"`
	PageSize  int    `json:"pageSize"`
	Search    string `json:"search"`
	Role      string `json:"role"`
	IsActive  *bool  `json:"isActive"`
	SortBy    string `json:"sortBy"`
	SortOrder string `json:"sortOrder"`
}

// UserSearchResponse represents paginated user search results
type UserSearchResponse struct {
	Users       []User            `json:"users"`
	Total       int64             `json:"total"`
	Page        int               `json:"page"`
	PageSize    int               `json:"pageSize"`
	TotalPages  int               `json:"totalPages"`
	HasNext     bool              `json:"hasNext"`
	HasPrevious bool              `json:"hasPrevious"`
}

// GetUsersWithPagination returns users with pagination, search, and filtering
func (s *AuthService) GetUsersWithPagination(req UserSearchRequest) (*UserSearchResponse, error) {
	// Set default values
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	if req.PageSize > 100 {
		req.PageSize = 100 // Max page size limit
	}
	if req.SortBy == "" {
		req.SortBy = "created_at"
	}
	if req.SortOrder == "" {
		req.SortOrder = "DESC"
	}

	// Build query
	query := s.db.Model(&User{})

	// Apply search filter (search in username, full_name, email)
	if req.Search != "" {
		searchTerm := "%" + strings.ToLower(req.Search) + "%"
		query = query.Where("LOWER(username) LIKE ? OR LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?",
			searchTerm, searchTerm, searchTerm)
	}

	// Apply role filter
	if req.Role != "" {
		query = query.Where("role = ?", req.Role)
	}

	// Apply active status filter
	if req.IsActive != nil {
		query = query.Where("is_active = ?", *req.IsActive)
	}

	// Count total records
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung total user: %w", err)
	}

	// Calculate offset
	offset := (req.Page - 1) * req.PageSize

	// Apply sorting
	validSortFields := map[string]bool{
		"username":   true,
		"full_name":  true,
		"email":      true,
		"role":       true,
		"is_active":  true,
		"created_at": true,
		"updated_at": true,
		"last_login_at": true,
	}

	if !validSortFields[req.SortBy] {
		req.SortBy = "created_at"
	}

	if req.SortOrder != "ASC" && req.SortOrder != "DESC" {
		req.SortOrder = "DESC"
	}

	// Get paginated results
	var users []User
	if err := query.Order(req.SortBy + " " + req.SortOrder).
		Limit(req.PageSize).Offset(offset).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil data user: %w", err)
	}

	// Calculate pagination info
	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))

	response := &UserSearchResponse{
		Users:       users,
		Total:       total,
		Page:        req.Page,
		PageSize:    req.PageSize,
		TotalPages:  totalPages,
		HasNext:     req.Page < totalPages,
		HasPrevious: req.Page > 1,
	}

	return response, nil
}

// GetUserStats returns statistics about users
func (s *AuthService) GetUserStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total users
	var totalUsers int64
	if err := s.db.Model(&User{}).Count(&totalUsers).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung total user: %w", err)
	}
	stats["totalUsers"] = totalUsers

	// Active users
	var activeUsers int64
	if err := s.db.Model(&User{}).Where("is_active = true").Count(&activeUsers).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung user aktif: %w", err)
	}
	stats["activeUsers"] = activeUsers

	// Users by role
	var roleStats []struct {
		Role  UserRole
		Count int64
	}
	if err := s.db.Model(&User{}).
		Select("role, count(*) as count").
		Where("is_active = true").
		Group("role").
		Scan(&roleStats).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung user per role: %w", err)
	}

	roleCount := make(map[string]int64)
	for _, stat := range roleStats {
		roleCount[stat.Role.String()] = stat.Count
	}
	stats["usersByRole"] = roleCount

	// Recent registrations (last 30 days)
	var recentUsers int64
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	if err := s.db.Model(&User{}).
		Where("created_at >= ?", thirtyDaysAgo).
		Count(&recentUsers).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung user baru: %w", err)
	}
	stats["recentUsers"] = recentUsers

	// Users who need password change
	var passwordChangeNeeded int64
	if err := s.db.Model(&User{}).
		Where("must_change_password = true AND is_active = true").
		Count(&passwordChangeNeeded).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung user yang perlu ganti password: %w", err)
	}
	stats["passwordChangeNeeded"] = passwordChangeNeeded

	return stats, nil
}

// GetUserActivity retrieves user activity logs
func (s *AuthService) GetUserActivity(userID uuid.UUID, limit int) ([]AuditLog, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200 // Max limit
	}

	var logs []AuditLog
	if err := s.db.Where("user_id = ?", userID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil activity log: %w", err)
	}

	return logs, nil
}

// ValidateUserUniqueness checks if username or email are unique
func (s *AuthService) ValidateUserUniqueness(username, email string, excludeID *uuid.UUID) error {
	// Check username uniqueness
	usernameQuery := s.db.Model(&User{}).Where("username = ?", username)
	if excludeID != nil {
		usernameQuery = usernameQuery.Where("id != ?", *excludeID)
	}

	var count int64
	if err := usernameQuery.Count(&count).Error; err != nil {
		return fmt.Errorf("gagal validasi username: %w", err)
	}
	if count > 0 {
		return errors.New("username sudah digunakan")
	}

	// Check email uniqueness (if email is provided)
	if email != "" {
		emailQuery := s.db.Model(&User{}).Where("email = ?", email)
		if excludeID != nil {
			emailQuery = emailQuery.Where("id != ?", *excludeID)
		}

		if err := emailQuery.Count(&count).Error; err != nil {
			return fmt.Errorf("gagal validasi email: %w", err)
		}
		if count > 0 {
			return errors.New("email sudah digunakan")
		}
	}

	return nil
}

// BulkUpdateUsers updates multiple users at once
func (s *AuthService) BulkUpdateUsers(userIDs []uuid.UUID, updates map[string]interface{}, adminID uuid.UUID) (int, error) {
	if len(userIDs) == 0 {
		return 0, errors.New("tidak ada user yang dipilih")
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Validate updates
	validFields := map[string]bool{
		"full_name": true,
		"email":     true,
		"role":      true,
		"is_active": true,
	}

	for field := range updates {
		if !validFields[field] {
			tx.Rollback()
			return 0, fmt.Errorf("field '%s' tidak valid untuk update", field)
		}
	}

	// Perform bulk update
	result := tx.Model(&User{}).Where("id IN ?", userIDs).Updates(updates)
	if result.Error != nil {
		tx.Rollback()
		return 0, fmt.Errorf("gagal update user: %w", result.Error)
	}

	// Log bulk update
	admin, err := s.GetUserByID(adminID)
	if err == nil {
		s.LogAuditEvent(&adminID, admin.Username, "USERS_BULK_UPDATED", "users", nil, true,
			fmt.Sprintf("updated %d users", int(result.RowsAffected)), "")
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return 0, fmt.Errorf("gagal commit transaksi: %w", err)
	}

	return int(result.RowsAffected), nil
}

// BulkDeleteUsers soft deletes multiple users at once
func (s *AuthService) BulkDeleteUsers(userIDs []uuid.UUID, adminID uuid.UUID) (int, error) {
	if len(userIDs) == 0 {
		return 0, errors.New("tidak ada user yang dipilih")
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Check if any of the users are admin
	var adminUsers []User
	if err := tx.Where("id IN ? AND role = ? AND is_active = true", userIDs, RoleAdmin).Find(&adminUsers).Error; err != nil {
		tx.Rollback()
		return 0, fmt.Errorf("gagal mengecek admin users: %w", err)
	}

	// Count total active admins
	var totalAdmins int64
	tx.Model(&User{}).Where("role = ? AND is_active = true", RoleAdmin).Count(&totalAdmins)

	// Prevent deleting the last admin
	if len(adminUsers) >= int(totalAdmins) {
		tx.Rollback()
		return 0, errors.New("tidak bisa menghapus semua admin. Minimal harus ada 1 admin aktif")
	}

	// Remove admin user from delete list if it's the last one
	if len(adminUsers) > 0 && int(totalAdmins) == len(adminUsers) {
		// Don't delete any admin users if they're all the admins left
		tx.Rollback()
		return 0, errors.New("tidak bisa menghapus admin. Minimal harus ada 1 admin aktif")
	}

	// Filter out admin users from deletion (for safety)
	var nonAdminUserIDs []uuid.UUID
	for _, userID := range userIDs {
		isAdmin := false
		for _, admin := range adminUsers {
			if userID == admin.ID {
				isAdmin = true
				break
			}
		}
		if !isAdmin {
			nonAdminUserIDs = append(nonAdminUserIDs, userID)
		}
	}

	if len(nonAdminUserIDs) == 0 {
		tx.Rollback()
		return 0, errors.New("tidak ada user yang bisa dihapus (hanya admin yang dipilih)")
	}

	// Perform soft delete
	result := tx.Model(&User{}).Where("id IN ?", nonAdminUserIDs).Update("is_active", false)
	if result.Error != nil {
		tx.Rollback()
		return 0, fmt.Errorf("gagal menghapus user: %w", result.Error)
	}

	// Log bulk deletion
	admin, err := s.GetUserByID(adminID)
	if err == nil {
		s.LogAuditEvent(&adminID, admin.Username, "USERS_BULK_DELETED", "users", nil, true,
			fmt.Sprintf("deleted %d users", int(result.RowsAffected)), "")
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return 0, fmt.Errorf("gagal commit transaksi: %w", err)
	}

	return int(result.RowsAffected), nil
}

// ExportUsersToCSV exports users to CSV format
func (s *AuthService) ExportUsersToCSV(includeInactive bool) (string, error) {
	var users []User
	query := s.db.Order("created_at DESC")

	if !includeInactive {
		query = query.Where("is_active = true")
	}

	if err := query.Find(&users).Error; err != nil {
		return "", fmt.Errorf("gagal mengambil data user: %w", err)
	}

	// Build CSV header
	csv := "ID,Username,Full Name,Email,Role,Is Active,Must Change Password,Created At,Last Login At\n"

	// Add user rows
	for _, user := range users {
		lastLogin := ""
		if user.LastLoginAt != nil {
			lastLogin = user.LastLoginAt.Format("2006-01-02 15:04:05")
		}

		// Escape fields that might contain commas
		csv += fmt.Sprintf("%s,%s,\"%s\",\"%s\",%s,%t,%t,%s,%s\n",
			user.ID.String(),
			user.Username,
			user.FullName,
			user.Email,
			user.Role,
			user.IsActive,
			user.MustChangePassword,
			user.CreatedAt.Format("2006-01-02 15:04:05"),
			lastLogin,
		)
	}

	return csv, nil
}

// ImportUserResult represents the result of importing a single user
type ImportUserResult struct {
	Row      int    `json:"row"`
	Username string `json:"username"`
	Success  bool   `json:"success"`
	Error    string `json:"error,omitempty"`
}

// ImportUsersFromCSV imports users from CSV data
func (s *AuthService) ImportUsersFromCSV(csvData string, adminID uuid.UUID) ([]ImportUserResult, error) {
	results := []ImportUserResult{}

	// Split CSV into lines
	lines := strings.Split(csvData, "\n")
	if len(lines) < 2 {
		return nil, errors.New("file CSV kosong atau tidak valid")
	}

	// Parse header
	header := strings.Split(lines[0], ",")

	// Validate header (case-insensitive)
	headerMap := make(map[string]int)
	for i, h := range header {
		headerMap[strings.TrimSpace(strings.ToLower(h))] = i
	}

	// Check required columns
	usernameIdx, hasUsername := headerMap["username"]
	fullNameIdx, hasFullName := headerMap["full name"]
	roleIdx, hasRole := headerMap["role"]
	passwordIdx, hasPassword := headerMap["password"]
	emailIdx, _ := headerMap["email"] // Email is optional

	if !hasUsername || !hasFullName || !hasRole || !hasPassword {
		return nil, errors.New("CSV harus memiliki kolom: Username, Full Name, Role, Password")
	}

	// Process each row
	for i, line := range lines[1:] {
		rowNum := i + 2 // +2 because: +1 for header, +1 for 1-based indexing
		line = strings.TrimSpace(line)

		// Skip empty lines
		if line == "" {
			continue
		}

		fields := parseCSVLine(line)
		if len(fields) < 4 {
			results = append(results, ImportUserResult{
				Row:     rowNum,
				Success: false,
				Error:   "jumlah kolom tidak valid",
			})
			continue
		}

		// Extract fields
		username := strings.TrimSpace(fields[usernameIdx])
		fullName := strings.TrimSpace(fields[fullNameIdx])
		roleStr := strings.TrimSpace(strings.ToUpper(fields[roleIdx]))
		password := strings.TrimSpace(fields[passwordIdx])

		email := ""
		if len(fields) > emailIdx {
			email = strings.TrimSpace(fields[emailIdx])
		}

		// Validate role
		var role UserRole
		switch roleStr {
		case "ADMIN":
			role = RoleAdmin
		case "SUPERVISOR":
			role = RoleSupervisor
		case "TIMBANGAN":
			role = RoleTimbangan
		case "GRADING":
			role = RoleGrading
		default:
			results = append(results, ImportUserResult{
				Row:      rowNum,
				Username: username,
				Success:  false,
				Error:    fmt.Sprintf("role tidak valid: %s (harus: ADMIN, SUPERVISOR, TIMBANGAN, atau GRADING)", roleStr),
			})
			continue
		}

		// Try to create user
		_, err := s.CreateUser(username, password, email, fullName, role, adminID.String())
		if err != nil {
			results = append(results, ImportUserResult{
				Row:      rowNum,
				Username: username,
				Success:  false,
				Error:    err.Error(),
			})
		} else {
			results = append(results, ImportUserResult{
				Row:      rowNum,
				Username: username,
				Success:  true,
			})
		}
	}

	return results, nil
}

// parseCSVLine parses a CSV line handling quoted fields
func parseCSVLine(line string) []string {
	var fields []string
	var currentField strings.Builder
	inQuotes := false

	for i := 0; i < len(line); i++ {
		char := line[i]

		if char == '"' {
			if inQuotes && i+1 < len(line) && line[i+1] == '"' {
				// Escaped quote
				currentField.WriteByte('"')
				i++ // Skip next quote
			} else {
				// Toggle quote mode
				inQuotes = !inQuotes
			}
		} else if char == ',' && !inQuotes {
			// End of field
			fields = append(fields, currentField.String())
			currentField.Reset()
		} else {
			currentField.WriteByte(char)
		}
	}

	// Add last field
	fields = append(fields, currentField.String())

	return fields
}

// GetAuditLogs returns audit logs with optional filtering (admin only)
func (s *AuthService) GetAuditLogs(limit int, offset int) ([]AuditLog, int64, error) {
	var logs []AuditLog
	var total int64

	// Count total records
	if err := s.db.Model(&AuditLog{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("gagal menghitung audit log: %w", err)
	}

	// Get paginated records
	if err := s.db.Order("timestamp DESC").Limit(limit).Offset(offset).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("gagal mengambil audit log: %w", err)
	}

	return logs, total, nil
}

// LogAudit logs an audit event for any operation (public method for use by other services)
func (s *AuthService) LogAudit(session *UserSession, action string, entityType string, entityID *uuid.UUID, details string) {
	if session == nil {
		return
	}
	s.LogAuditEvent(&session.UserID, session.Username, action, entityType, entityID, true, details, session.DeviceID)
}

// LogAuditByUserID logs an audit event for a specific user ID
func (s *AuthService) LogAuditByUserID(userID *uuid.UUID, username, action, details, deviceID string) {
	s.LogAuditEvent(userID, username, action, "", nil, true, details, deviceID)
}

// LogAuditEvent logs audit events - made public for other services to use
func (s *AuthService) LogAuditEvent(userID *uuid.UUID, username, action, entityType string, entityID *uuid.UUID, success bool, errorMsg, deviceID string) {
	audit := AuditLog{
		ID:         uuid.New(),
		UserID:     userID,
		Username:   username,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		IPAddress:  "localhost", // Desktop app, always localhost
		Success:    success,
		Timestamp:  time.Now(),
	}

	if errorMsg != "" {
		audit.ErrorMsg = &errorMsg
	}

	// Store device ID in details if provided
	if deviceID != "" {
		details := fmt.Sprintf(`{"deviceId": "%s"}`, deviceID)
		audit.Details = &details
	}

	// Don't fail operations if audit logging fails
	if err := s.db.Create(&audit).Error; err != nil {
		fmt.Printf("Warning: failed to create audit log: %v\n", err)
	}
}

// ========================================
// API Key Management Methods (ADMIN only)
// ========================================

// CreateAPIKey creates a new API key (admin only)
func (s *AuthService) CreateAPIKey(name, description, apiKey, serverURL string, createdBy uuid.UUID) (*APIKey, error) {
	// Validate inputs
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errors.New("nama API key tidak boleh kosong")
	}

	apiKey = strings.TrimSpace(apiKey)
	if apiKey == "" {
		return nil, errors.New("API key tidak boleh kosong")
	}

	if len(apiKey) < 10 {
		return nil, errors.New("API key terlalu pendek (minimal 10 karakter)")
	}

	serverURL = strings.TrimSpace(serverURL)
	if serverURL == "" {
		return nil, errors.New("server URL tidak boleh kosong")
	}

	// Basic URL validation
	if !strings.HasPrefix(serverURL, "http://") && !strings.HasPrefix(serverURL, "https://") {
		return nil, errors.New("server URL harus dimulai dengan http:// atau https://")
	}

	// Check if name already exists
	var existingKey APIKey
	if err := s.db.Where("name = ?", name).First(&existingKey).Error; err == nil {
		return nil, errors.New("nama API key sudah digunakan")
	}

	// Create API key
	newAPIKey := &APIKey{
		Name:        name,
		Description: strings.TrimSpace(description),
		IsActive:    true,
		ServerURL:   serverURL,
		CreatedBy:   &createdBy,
	}

	// Encrypt and set the API key
	if err := newAPIKey.SetAPIKey(apiKey); err != nil {
		return nil, fmt.Errorf("gagal mengenkripsi API key: %w", err)
	}

	// Save to database
	if err := s.db.Create(newAPIKey).Error; err != nil {
		return nil, fmt.Errorf("gagal membuat API key: %w", err)
	}

	// Log the creation
	admin, err := s.GetUserByID(createdBy)
	if err == nil {
		s.LogAuditEvent(&createdBy, admin.Username, "API_KEY_CREATED", "api_key", &newAPIKey.ID, true,
			fmt.Sprintf("created API key: %s", name), "")
	}

	return newAPIKey, nil
}

// GetAPIKeys returns all API keys (admin only)
func (s *AuthService) GetAPIKeys() ([]APIKey, error) {
	var apiKeys []APIKey
	if err := s.db.Preload("CreatorUser").Preload("UpdaterUser").Order("created_at DESC").Find(&apiKeys).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil API keys: %w", err)
	}
	return apiKeys, nil
}

// GetAPIKey returns a single API key by ID (admin only)
func (s *AuthService) GetAPIKey(id uuid.UUID) (*APIKey, error) {
	var apiKey APIKey
	if err := s.db.Preload("CreatorUser").Preload("UpdaterUser").First(&apiKey, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("API key tidak ditemukan")
		}
		return nil, fmt.Errorf("gagal mengambil API key: %w", err)
	}
	return &apiKey, nil
}

// UpdateAPIKey updates an API key (admin only) - does not update the actual key value
func (s *AuthService) UpdateAPIKey(id uuid.UUID, name, description, serverURL string, updatedBy uuid.UUID) (*APIKey, error) {
	// Find existing API key
	var apiKey APIKey
	if err := s.db.First(&apiKey, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("API key tidak ditemukan")
		}
		return nil, fmt.Errorf("gagal mengambil API key: %w", err)
	}

	// Validate inputs
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errors.New("nama API key tidak boleh kosong")
	}

	// Check if name already exists (excluding this key)
	var existingKey APIKey
	if err := s.db.Where("name = ? AND id != ?", name, id).First(&existingKey).Error; err == nil {
		return nil, errors.New("nama API key sudah digunakan")
	}

	serverURL = strings.TrimSpace(serverURL)
	if serverURL != "" {
		// Basic URL validation
		if !strings.HasPrefix(serverURL, "http://") && !strings.HasPrefix(serverURL, "https://") {
			return nil, errors.New("server URL harus dimulai dengan http:// atau https://")
		}
	}

	// Update fields
	apiKey.Name = name
	apiKey.Description = strings.TrimSpace(description)
	if serverURL != "" {
		apiKey.ServerURL = serverURL
	}
	apiKey.UpdatedBy = &updatedBy

	// Save changes
	if err := s.db.Save(&apiKey).Error; err != nil {
		return nil, fmt.Errorf("gagal update API key: %w", err)
	}

	// Log the update
	admin, err := s.GetUserByID(updatedBy)
	if err == nil {
		s.LogAuditEvent(&updatedBy, admin.Username, "API_KEY_UPDATED", "api_key", &apiKey.ID, true,
			fmt.Sprintf("updated API key: %s", name), "")
	}

	return &apiKey, nil
}

// DeactivateAPIKey deactivates an API key (admin only)
func (s *AuthService) DeactivateAPIKey(id uuid.UUID, deactivatedBy uuid.UUID) error {
	// Find existing API key
	var apiKey APIKey
	if err := s.db.First(&apiKey, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("API key tidak ditemukan")
		}
		return fmt.Errorf("gagal mengambil API key: %w", err)
	}

	if !apiKey.IsActive {
		return errors.New("API key sudah tidak aktif")
	}

	// Deactivate the key
	apiKey.IsActive = false
	apiKey.UpdatedBy = &deactivatedBy

	if err := s.db.Save(&apiKey).Error; err != nil {
		return fmt.Errorf("gagal menonaktifkan API key: %w", err)
	}

	// Log the deactivation
	admin, err := s.GetUserByID(deactivatedBy)
	if err == nil {
		s.LogAuditEvent(&deactivatedBy, admin.Username, "API_KEY_DEACTIVATED", "api_key", &apiKey.ID, true,
			fmt.Sprintf("deactivated API key: %s", apiKey.Name), "")
	}

	return nil
}

// ReactivateAPIKey reactivates an API key (admin only)
func (s *AuthService) ReactivateAPIKey(id uuid.UUID, reactivatedBy uuid.UUID) error {
	// Find existing API key
	var apiKey APIKey
	if err := s.db.First(&apiKey, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("API key tidak ditemukan")
		}
		return fmt.Errorf("gagal mengambil API key: %w", err)
	}

	if apiKey.IsActive {
		return errors.New("API key sudah aktif")
	}

	// Reactivate the key
	apiKey.IsActive = true
	apiKey.UpdatedBy = &reactivatedBy

	if err := s.db.Save(&apiKey).Error; err != nil {
		return fmt.Errorf("gagal mengaktifkan kembali API key: %w", err)
	}

	// Log the reactivation
	admin, err := s.GetUserByID(reactivatedBy)
	if err == nil {
		s.LogAuditEvent(&reactivatedBy, admin.Username, "API_KEY_REACTIVATED", "api_key", &apiKey.ID, true,
			fmt.Sprintf("reactivated API key: %s", apiKey.Name), "")
	}

	return nil
}

// DeleteAPIKey deletes an API key permanently (admin only)
func (s *AuthService) DeleteAPIKey(id uuid.UUID, deletedBy uuid.UUID) error {
	// Find existing API key
	var apiKey APIKey
	if err := s.db.First(&apiKey, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("API key tidak ditemukan")
		}
		return fmt.Errorf("gagal mengambil API key: %w", err)
	}

	// Get name for logging
	keyName := apiKey.Name

	// Delete the key
	if err := s.db.Delete(&apiKey).Error; err != nil {
		return fmt.Errorf("gagal menghapus API key: %w", err)
	}

	// Log the deletion
	admin, err := s.GetUserByID(deletedBy)
	if err == nil {
		s.LogAuditEvent(&deletedBy, admin.Username, "API_KEY_DELETED", "api_key", &apiKey.ID, true,
			fmt.Sprintf("deleted API key: %s", keyName), "")
	}

	return nil
}

// GetActiveAPIKeyForURL returns the first active API key for a given server URL
func (s *AuthService) GetActiveAPIKeyForURL(serverURL string) (*APIKey, error) {
	var apiKey APIKey
	if err := s.db.Where("server_url = ? AND is_active = true", serverURL).First(&apiKey).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("tidak ada API key aktif untuk server URL ini")
		}
		return nil, fmt.Errorf("gagal mengambil API key: %w", err)
	}
	return &apiKey, nil
}
