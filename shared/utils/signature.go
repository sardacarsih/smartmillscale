package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// SignPayload creates an HMAC-SHA256 signature for a payload
func SignPayload(payload string, apiKey string, timestamp int64) string {
	// Combine payload and timestamp
	message := fmt.Sprintf("%s:%d", payload, timestamp)

	// Create HMAC
	mac := hmac.New(sha256.New, []byte(apiKey))
	mac.Write([]byte(message))

	// Return hex-encoded signature
	return hex.EncodeToString(mac.Sum(nil))
}

// VerifySignature verifies an HMAC signature
func VerifySignature(payload string, signature string, apiKey string, timestamp int64) bool {
	expectedSignature := SignPayload(payload, apiKey, timestamp)
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// ValidateTimestamp checks if a timestamp is within acceptable range (prevents replay attacks)
func ValidateTimestamp(timestamp int64, maxAgeSeconds int64) bool {
	now := time.Now().Unix()
	age := now - timestamp

	// Check if timestamp is not too old and not in the future
	return age >= 0 && age <= maxAgeSeconds
}

// HashAPIKey hashes an API key using SHA-256 for storage
func HashAPIKey(apiKey string) string {
	hash := sha256.Sum256([]byte(apiKey))
	return hex.EncodeToString(hash[:])
}

// GenerateAPIKey generates a secure random API key
func GenerateAPIKey() (string, error) {
	// Generate a UUID as the API key
	key := GenerateDeviceID()
	return key.String(), nil
}
