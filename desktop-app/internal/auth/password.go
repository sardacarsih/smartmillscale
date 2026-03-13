package auth

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"regexp"

	"golang.org/x/crypto/bcrypt"
)

const (
	// BcryptCost is the cost factor for bcrypt hashing (2^12 = 4096 iterations)
	// Higher values are more secure but slower. 12 is recommended for 2024.
	BcryptCost = 12

	// MinPasswordLength is the minimum allowed password length
	MinPasswordLength = 8
)

// HashPassword hashes a password using bcrypt with cost factor 12
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("password tidak boleh kosong")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

// VerifyPassword verifies a password against a bcrypt hash
func VerifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// CheckPasswordHash is an alias for VerifyPassword for compatibility
func CheckPasswordHash(password, hash string) bool {
	return VerifyPassword(password, hash)
}

// ValidatePasswordStrength validates password strength requirements using default policy
// For operator convenience, we keep requirements reasonable:
// - Minimum 8 characters
// - Must contain at least one letter
// - Must contain at least one number
func ValidatePasswordStrength(password string) error {
	policy := GetDefaultPasswordPolicy()
	return ValidatePasswordWithPolicy(password, policy)
}

// ValidatePasswordWithPolicy validates password strength against a specific policy
func ValidatePasswordWithPolicy(password string, policy PasswordPolicy) error {
	if len(password) < policy.MinLength {
		return fmt.Errorf("password minimal %d karakter", policy.MinLength)
	}

	// Check for at least one letter (any case)
	if policy.RequireLetter {
		hasLetter := regexp.MustCompile(`[a-zA-Z]`).MatchString(password)
		if !hasLetter {
			return errors.New("password harus mengandung minimal 1 huruf")
		}
	}

	// Check for at least one uppercase letter
	if policy.RequireUpper {
		hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
		if !hasUpper {
			return errors.New("password harus mengandung minimal 1 huruf besar")
		}
	}

	// Check for at least one lowercase letter
	if policy.RequireLower {
		hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
		if !hasLower {
			return errors.New("password harus mengandung minimal 1 huruf kecil")
		}
	}

	// Check for at least one number
	if policy.RequireNumber {
		hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
		if !hasNumber {
			return errors.New("password harus mengandung minimal 1 angka")
		}
	}

	// Check for at least one special character
	if policy.RequireSpecial {
		hasSpecial := regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]`).MatchString(password)
		if !hasSpecial {
			return errors.New("password harus mengandung minimal 1 karakter spesial (!@#$%^&* dll)")
		}
	}

	return nil
}

// ValidateStrongPassword validates strong password requirements (for admin)
// Stricter requirements for admin accounts:
// - Minimum 8 characters
// - Must contain at least one letter
// - Must contain at least one number
// - Must contain at least one special character
func ValidateStrongPassword(password string) error {
	if err := ValidatePasswordStrength(password); err != nil {
		return err
	}

	// Check for at least one special character
	hasSpecial := regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]`).MatchString(password)
	if !hasSpecial {
		return errors.New("password admin harus mengandung minimal 1 karakter spesial (!@#$%^&* dll)")
	}

	return nil
}

// GenerateRandomPassword generates a cryptographically secure random password
// The password will contain a mix of uppercase, lowercase, numbers, and special characters
func GenerateRandomPassword(length int) (string, error) {
	if length < MinPasswordLength {
		length = MinPasswordLength
	}

	const (
		lowercase = "abcdefghijklmnopqrstuvwxyz"
		uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		numbers   = "0123456789"
		special   = "!@#$%^&*"
		all       = lowercase + uppercase + numbers + special
	)

	password := make([]byte, length)

	// Ensure at least one character from each category
	categories := []string{lowercase, uppercase, numbers, special}
	for i, category := range categories {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(category))))
		if err != nil {
			return "", err
		}
		password[i] = category[n.Int64()]
	}

	// Fill the rest with random characters from all categories
	for i := len(categories); i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(all))))
		if err != nil {
			return "", err
		}
		password[i] = all[n.Int64()]
	}

	// Shuffle the password to avoid predictable patterns
	for i := length - 1; i > 0; i-- {
		j, err := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		if err != nil {
			return "", err
		}
		password[i], password[j.Int64()] = password[j.Int64()], password[i]
	}

	return string(password), nil
}

// IsValidUsername checks if a username contains only allowed characters
// Allowed: alphanumeric, underscore, dash
// This prevents SQL injection and ensures clean usernames
func IsValidUsername(username string) bool {
	if len(username) < 3 || len(username) > 50 {
		return false
	}

	validUsername := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
	return validUsername.MatchString(username)
}
