package utils

import (
	"fmt"
	"regexp"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

var (
	// VehicleNumberRegex validates vehicle number format (customize as needed)
	VehicleNumberRegex = regexp.MustCompile(`^[A-Z0-9]{1,50}$`)
)

// ValidateTimbanganData validates weighing data
func ValidateTimbanganData(data types.TimbanganData) []types.ValidationError {
	var errors []types.ValidationError

	// Validate IDLocal
	if data.IDLocal == uuid.Nil {
		errors = append(errors, types.ValidationError{
			Field:   "idLocal",
			Message: "must be a valid UUID",
		})
	}

	// Validate vehicle number
	if data.NomorKendaraan == "" {
		errors = append(errors, types.ValidationError{
			Field:   "nomorKendaraan",
			Message: "cannot be empty",
		})
	} else if len(data.NomorKendaraan) > 50 {
		errors = append(errors, types.ValidationError{
			Field:   "nomorKendaraan",
			Message: "exceeds maximum length of 50 characters",
		})
	}

	// Validate weights
	if data.BeratKotor <= 0 {
		errors = append(errors, types.ValidationError{
			Field:   "beratKotor",
			Message: "must be greater than 0",
		})
	}

	if data.BeratBersih < 0 {
		errors = append(errors, types.ValidationError{
			Field:   "beratBersih",
			Message: "cannot be negative",
		})
	}

	if data.BeratBersih > data.BeratKotor {
		errors = append(errors, types.ValidationError{
			Field:   "beratBersih",
			Message: "cannot be greater than beratKotor",
		})
	}

	// Validate timestamp
	if data.Tanggal.IsZero() {
		errors = append(errors, types.ValidationError{
			Field:   "tanggal",
			Message: "cannot be empty",
		})
	}

	// Check if timestamp is not too far in the future (max 1 day)
	maxFuture := time.Now().Add(24 * time.Hour)
	if data.Tanggal.After(maxFuture) {
		errors = append(errors, types.ValidationError{
			Field:   "tanggal",
			Message: "cannot be more than 1 day in the future",
		})
	}

	// Validate idempotency key
	if data.IdempotencyKey == "" {
		errors = append(errors, types.ValidationError{
			Field:   "idempotencyKey",
			Message: "cannot be empty",
		})
	} else if !ValidateIdempotencyKey(data.IdempotencyKey) {
		errors = append(errors, types.ValidationError{
			Field:   "idempotencyKey",
			Message: "invalid format",
		})
	}

	// Validate device ID
	if data.DeviceID == "" {
		errors = append(errors, types.ValidationError{
			Field:   "deviceId",
			Message: "cannot be empty",
		})
	}

	return errors
}

// ValidateBatchSize validates the batch size for sync operations
func ValidateBatchSize(size int) error {
	if size <= 0 {
		return fmt.Errorf("batch size must be greater than 0")
	}
	if size > 100 {
		return fmt.Errorf("batch size cannot exceed 100")
	}
	return nil
}

// ValidateDeviceID validates a device ID
func ValidateDeviceID(id string) bool {
	_, err := uuid.Parse(id)
	return err == nil
}

// ValidateAPIKey validates an API key format
func ValidateAPIKey(apiKey string) bool {
	// API key should be a UUID
	_, err := uuid.Parse(apiKey)
	return err == nil
}

// ValidateSyncRequest validates a sync request
func ValidateSyncRequest(req types.SyncRequest) []types.ValidationError {
	var errors []types.ValidationError

	// Validate device ID
	if req.DeviceID == uuid.Nil {
		errors = append(errors, types.ValidationError{
			Field:   "deviceId",
			Message: "must be a valid UUID",
		})
	}

	// Validate timestamp (max 5 minutes old)
	if !ValidateTimestamp(req.Timestamp, 300) {
		errors = append(errors, types.ValidationError{
			Field:   "timestamp",
			Message: "timestamp expired or invalid",
		})
	}

	// Validate signature
	if req.Signature == "" {
		errors = append(errors, types.ValidationError{
			Field:   "signature",
			Message: "cannot be empty",
		})
	}

	// Validate records
	if len(req.Records) == 0 {
		errors = append(errors, types.ValidationError{
			Field:   "records",
			Message: "must contain at least one record",
		})
	}

	// Validate batch size
	if err := ValidateBatchSize(len(req.Records)); err != nil {
		errors = append(errors, types.ValidationError{
			Field:   "records",
			Message: err.Error(),
		})
	}

	// Validate each record
	for i, record := range req.Records {
		recordErrors := ValidateTimbanganData(record)
		for _, err := range recordErrors {
			errors = append(errors, types.ValidationError{
				Field:   fmt.Sprintf("records[%d].%s", i, err.Field),
				Message: err.Message,
			})
		}
	}

	return errors
}
