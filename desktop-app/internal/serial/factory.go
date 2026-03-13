package serial

import (
	"fmt"
	"log"

	"github.com/yourusername/gosmartmillscale/shared/types"
)

// CreateSerialReader creates a serial reader based on configuration
func CreateSerialReader(config types.WeighingConfig) (SerialReaderInterface, error) {
	if config.MockSerialEnabled {
		log.Printf("Creating mock serial reader for development")
		return NewMockSerialReader(config), nil
	}

	log.Printf("Creating real serial reader for COM port: %s", config.COMPort)

	// Validate real serial configuration
	if config.COMPort == "" {
		return nil, fmt.Errorf("COM port cannot be empty for real serial connection")
	}

	if config.BaudRate <= 0 {
		return nil, fmt.Errorf("baud rate must be positive for real serial connection")
	}

	return NewSerialReader(config), nil
}

// IsMockMode returns true if mock serial is enabled in configuration
func IsMockMode(config types.WeighingConfig) bool {
	return config.MockSerialEnabled
}

// ValidateSerialConfig validates serial configuration for real device
func ValidateSerialConfig(config types.WeighingConfig) error {
	if config.MockSerialEnabled {
		// Mock mode doesn't need validation
		return nil
	}

	if config.COMPort == "" {
		return fmt.Errorf("COM port is required for real device connection")
	}

	if config.BaudRate <= 0 {
		return fmt.Errorf("invalid baud rate: %d", config.BaudRate)
	}

	if config.DataBits < 5 || config.DataBits > 9 {
		return fmt.Errorf("invalid data bits: %d (must be 5-9)", config.DataBits)
	}

	if config.StopBits < 1 || config.StopBits > 2 {
		return fmt.Errorf("invalid stop bits: %d (must be 1 or 2)", config.StopBits)
	}

	validParity := map[string]bool{
		"N": true, // None
		"E": true, // Even
		"O": true, // Odd
		"M": true, // Mark
		"S": true, // Space
	}

	if !validParity[config.Parity] {
		return fmt.Errorf("invalid parity: %s (must be N, E, O, M, or S)", config.Parity)
	}

	return nil
}