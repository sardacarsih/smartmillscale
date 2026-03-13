package utils

import (
	"crypto/sha256"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// GenerateIdempotencyKey creates a unique idempotency key for a weighing record
// Format: DEVICE_ID:TIMESTAMP:HASH(vehicle+weight)
func GenerateIdempotencyKey(deviceID string, vehicleNumber string, weight int, timestamp time.Time) string {
	// Create a unique hash of the weighing data
	data := fmt.Sprintf("%s:%d:%d", vehicleNumber, weight, timestamp.Unix())
	hash := sha256.Sum256([]byte(data))

	// Use first 8 bytes of hash for compactness
	shortHash := fmt.Sprintf("%x", hash[:8])

	// Combine device ID, timestamp, and hash
	return fmt.Sprintf("%s:%d:%s", deviceID, timestamp.Unix(), shortHash)
}

// GenerateIdempotencyKeyFromData creates idempotency key from TimbanganData
func GenerateIdempotencyKeyFromData(deviceID string, nomorKendaraan string, beratKotor int, tanggal time.Time) string {
	return GenerateIdempotencyKey(deviceID, nomorKendaraan, beratKotor, tanggal)
}

// ParseIdempotencyKey parses an idempotency key and returns its components
func ParseIdempotencyKey(key string) (deviceID string, timestamp int64, hash string, err error) {
	var ts int64
	var dev, h string

	_, err = fmt.Sscanf(key, "%s:%d:%s", &dev, &ts, &h)
	if err != nil {
		return "", 0, "", fmt.Errorf("invalid idempotency key format: %w", err)
	}

	return dev, ts, h, nil
}

// ValidateIdempotencyKey validates the format of an idempotency key
func ValidateIdempotencyKey(key string) bool {
	_, _, _, err := ParseIdempotencyKey(key)
	return err == nil
}

// GenerateDeviceID generates a new UUID for a device
func GenerateDeviceID() uuid.UUID {
	return uuid.New()
}

// GenerateLocalID generates a new UUID for a local record
func GenerateLocalID() uuid.UUID {
	return uuid.New()
}
