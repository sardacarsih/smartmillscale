package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

// AppConfig wraps types.AppConfig with file operations
type AppConfig struct {
	types.AppConfig
	configPath string
}

// LoadConfig loads configuration from file and environment variables
func LoadConfig(configPath string) (*AppConfig, error) {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		// .env file not found is not an error in production
		if !os.IsNotExist(err) {
			fmt.Printf("Warning: Failed to load .env file: %v\n", err)
		}
	}

	// Check if config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Create default config with environment variables
		config := createDefaultConfigFromEnv()
		config.configPath = configPath

		// Save default config
		if err := config.Save(); err != nil {
			return nil, fmt.Errorf("failed to save default config: %w", err)
		}

		return config, nil
	}

	// Read config file
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	// Parse config
	var appConfig types.AppConfig
	if err := json.Unmarshal(data, &appConfig); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	config := &AppConfig{
		AppConfig:  appConfig,
		configPath: configPath,
	}

	// Override config with environment variables
	overrideConfigFromEnv(config)

	// Validate config
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	return config, nil
}

// Save saves configuration to file
func (c *AppConfig) Save() error {
	// Ensure directory exists
	dir := filepath.Dir(c.configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Marshal config to JSON (pretty print)
	data, err := json.MarshalIndent(c.AppConfig, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Write to file
	if err := os.WriteFile(c.configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// Validate validates configuration
func (c *AppConfig) Validate() error {
	if c.DeviceID == uuid.Nil {
		return fmt.Errorf("device ID cannot be empty")
	}

	if c.DeviceName == "" {
		return fmt.Errorf("device name cannot be empty")
	}

	if c.DatabasePath == "" {
		return fmt.Errorf("database path cannot be empty")
	}

	if c.Weighing.COMPort == "" {
		return fmt.Errorf("COM port cannot be empty")
	}

	if c.Weighing.BaudRate <= 0 {
		return fmt.Errorf("baud rate must be positive")
	}

	if c.Sync.ServerURL == "" {
		return fmt.Errorf("server URL cannot be empty")
	}

	if c.Sync.SyncInterval <= 0 {
		return fmt.Errorf("sync interval must be positive")
	}

	if c.Sync.MaxRetries < 0 {
		return fmt.Errorf("max retries cannot be negative")
	}

	if c.Sync.BatchSize <= 0 || c.Sync.BatchSize > 100 {
		return fmt.Errorf("batch size must be between 1 and 100")
	}

	return nil
}

// UpdateWeighingConfig updates weighing configuration
func (c *AppConfig) UpdateWeighingConfig(config types.WeighingConfig) error {
	c.Weighing = config
	return c.Save()
}

// UpdateSyncConfig updates sync configuration
func (c *AppConfig) UpdateSyncConfig(config types.SyncConfig) error {
	c.Sync = config
	return c.Save()
}

// UpdateDeviceInfo updates device information
func (c *AppConfig) UpdateDeviceInfo(name, location string) error {
	c.DeviceName = name
	c.Location = location
	return c.Save()
}

// createDefaultConfig creates a default configuration
func createDefaultConfig() *AppConfig {
	return &AppConfig{
		AppConfig: types.AppConfig{
			DeviceID:     uuid.New(),
			DeviceName:   "Timbangan Baru",
			Location:     "Gudang",
			DatabasePath: "./data/smartmill.db",
			Weighing: types.WeighingConfig{
				COMPort:         "COM1",
				BaudRate:        9600,
				DataBits:        8,
				StopBits:        1,
				Parity:          "N",
				ReadTimeout:     5000,
				WriteTimeout:    5000,
				MockSerialEnabled: true,
			},
			Sync: types.SyncConfig{
				ServerURL:      "https://localhost:8443/graphql",
				SyncInterval:   5 * time.Minute,
				MaxRetries:     5,
				RetryBackoff:   1 * time.Second,
				BatchSize:      50,
				RequestTimeout: 30 * time.Second,
			},
		},
	}
}

// createDefaultConfigFromEnv creates a default configuration with environment variables
func createDefaultConfigFromEnv() *AppConfig {
	config := &AppConfig{
		AppConfig: types.AppConfig{
			DeviceID:     uuid.New(),
			DeviceName:   getEnvOrDefault("DEVICE_NAME_DEFAULT", "Timbangan Baru"),
			Location:     getEnvOrDefault("DEVICE_LOCATION_DEFAULT", "Gudang"),
			DatabasePath: getEnvOrDefault("DB_PATH", "./data/smartmill.db"),
			Weighing: types.WeighingConfig{
				COMPort:         getEnvOrDefault("SERIAL_COM_PORT", "COM1"),
				BaudRate:        getEnvIntOrDefault("SERIAL_BAUD_RATE", 9600),
				DataBits:        getEnvIntOrDefault("SERIAL_DATA_BITS", 8),
				StopBits:        getEnvIntOrDefault("SERIAL_STOP_BITS", 1),
				Parity:          getEnvOrDefault("SERIAL_PARITY", "N"),
				ReadTimeout:     getEnvIntOrDefault("SERIAL_READ_TIMEOUT", 1000),
				WriteTimeout:    getEnvIntOrDefault("SERIAL_WRITE_TIMEOUT", 1000),
				MockSerialEnabled: getEnvBoolOrDefault("MOCK_SERIAL_ENABLED", true),

				// Mock Serial Configuration from .env
				// Note: .env values are in kg, convert to centesimal (1 kg = 100 centesimal)
				MockInterval:  getEnvIntOrDefault("MOCK_SERIAL_INTERVAL", 1000),           // 1s default in milliseconds
				MockMinWeight: getEnvIntOrDefault("MOCK_SERIAL_MIN_WEIGHT", 0) * 100,      // 0 kg -> centesimal
				MockMaxWeight: getEnvIntOrDefault("MOCK_SERIAL_MAX_WEIGHT", 15000) * 100,  // 15000 kg -> centesimal
				MockVariance:  getEnvIntOrDefault("MOCK_SERIAL_VARIANCE", 50) * 100,       // 50 kg -> centesimal
			},
			Sync: types.SyncConfig{
				ServerURL:      getEnvOrDefault("SYNC_SERVER_URL", "https://localhost:8443/graphql"),
				SyncInterval:   getEnvDurationOrDefault("SYNC_INTERVAL", 5*time.Minute),
				MaxRetries:     getEnvIntOrDefault("SYNC_MAX_RETRIES", 5),
				RetryBackoff:   getEnvDurationOrDefault("SYNC_RETRY_DELAY", 1*time.Second),
				BatchSize:      getEnvIntOrDefault("SYNC_BATCH_SIZE", 50),
				RequestTimeout: getEnvDurationOrDefault("API_TIMEOUT", 30*time.Second),
			},
		},
	}

	// Generate device ID if auto-generation is enabled
	if getEnvBoolOrDefault("DEVICE_ID_AUTO_GENERATE", true) {
		config.AppConfig.DeviceID = uuid.New()
	}

	return config
}

// overrideConfigFromEnv overrides configuration with environment variables
func overrideConfigFromEnv(config *AppConfig) {
	// Device configuration
	if name := os.Getenv("DEVICE_NAME"); name != "" {
		config.DeviceName = name
	}
	if location := os.Getenv("DEVICE_LOCATION"); location != "" {
		config.Location = location
	}
	if dbPath := os.Getenv("DB_PATH"); dbPath != "" {
		config.DatabasePath = dbPath
	}

	// Serial port configuration
	if comPort := os.Getenv("SERIAL_COM_PORT"); comPort != "" {
		config.Weighing.COMPort = comPort
	}
	if baudRate := os.Getenv("SERIAL_BAUD_RATE"); baudRate != "" {
		if rate, err := strconv.Atoi(baudRate); err == nil && rate > 0 {
			config.Weighing.BaudRate = rate
		}
	}
	if dataBits := os.Getenv("SERIAL_DATA_BITS"); dataBits != "" {
		if bits, err := strconv.Atoi(dataBits); err == nil && bits > 0 {
			config.Weighing.DataBits = bits
		}
	}
	if stopBits := os.Getenv("SERIAL_STOP_BITS"); stopBits != "" {
		if bits, err := strconv.Atoi(stopBits); err == nil && bits > 0 {
			config.Weighing.StopBits = bits
		}
	}
	if parity := os.Getenv("SERIAL_PARITY"); parity != "" {
		config.Weighing.Parity = parity
	}
	if mockSerialEnabled := os.Getenv("MOCK_SERIAL_ENABLED"); mockSerialEnabled != "" {
		if enabled, err := strconv.ParseBool(mockSerialEnabled); err == nil {
			config.Weighing.MockSerialEnabled = enabled
		}
	}

	// Mock Serial Configuration
	// Note: .env values are in kg, need to convert to centesimal (1 kg = 100 centesimal)
	if mockInterval := os.Getenv("MOCK_SERIAL_INTERVAL"); mockInterval != "" {
		if interval, err := strconv.Atoi(mockInterval); err == nil && interval > 0 {
			config.Weighing.MockInterval = interval
		}
	}
	if mockMinWeight := os.Getenv("MOCK_SERIAL_MIN_WEIGHT"); mockMinWeight != "" {
		if weight, err := strconv.Atoi(mockMinWeight); err == nil {
			config.Weighing.MockMinWeight = weight * 100 // Convert kg to centesimal
		}
	}
	if mockMaxWeight := os.Getenv("MOCK_SERIAL_MAX_WEIGHT"); mockMaxWeight != "" {
		if weight, err := strconv.Atoi(mockMaxWeight); err == nil {
			config.Weighing.MockMaxWeight = weight * 100 // Convert kg to centesimal
		}
	}
	if mockVariance := os.Getenv("MOCK_SERIAL_VARIANCE"); mockVariance != "" {
		if variance, err := strconv.Atoi(mockVariance); err == nil {
			config.Weighing.MockVariance = variance * 100 // Convert kg to centesimal
		}
	}

	// Sync configuration
	if serverURL := os.Getenv("SYNC_SERVER_URL"); serverURL != "" {
		config.Sync.ServerURL = serverURL
	}
	if syncInterval := os.Getenv("SYNC_INTERVAL"); syncInterval != "" {
		if duration, err := time.ParseDuration(syncInterval); err == nil && duration > 0 {
			config.Sync.SyncInterval = duration
		}
	}
	if maxRetries := os.Getenv("SYNC_MAX_RETRIES"); maxRetries != "" {
		if retries, err := strconv.Atoi(maxRetries); err == nil && retries >= 0 {
			config.Sync.MaxRetries = retries
		}
	}
	if retryDelay := os.Getenv("SYNC_RETRY_DELAY"); retryDelay != "" {
		if duration, err := time.ParseDuration(retryDelay); err == nil && duration > 0 {
			config.Sync.RetryBackoff = duration
		}
	}
	if batchSize := os.Getenv("SYNC_BATCH_SIZE"); batchSize != "" {
		if size, err := strconv.Atoi(batchSize); err == nil && size > 0 {
			config.Sync.BatchSize = size
		}
	}
}

// Helper functions for environment variable handling
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvIntOrDefault(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvDurationOrDefault(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvBoolOrDefault(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// GetConfigPath returns the default config path
func GetConfigPath() string {
	// Get user's config directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "./config.json"
	}

	// Use AppData on Windows
	configDir := filepath.Join(homeDir, "AppData", "Local", "SmartMillScale")
	return filepath.Join(configDir, "config.json")
}

// GetDataDirectory returns the default data directory
func GetDataDirectory() string {
	// Always use relative path for consistency across development and production
	return "./data"
}

// EnsureDirectories ensures all required directories exist
func EnsureDirectories(config *AppConfig) error {
	// Ensure database directory exists
	dbDir := filepath.Dir(config.DatabasePath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	return nil
}

// ExportConfig exports configuration to a file
func (c *AppConfig) ExportConfig(exportPath string) error {
	data, err := json.MarshalIndent(c.AppConfig, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(exportPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write export file: %w", err)
	}

	return nil
}

// ImportConfig imports configuration from a file
func ImportConfig(importPath, configPath string) (*AppConfig, error) {
	data, err := os.ReadFile(importPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read import file: %w", err)
	}

	var appConfig types.AppConfig
	if err := json.Unmarshal(data, &appConfig); err != nil {
		return nil, fmt.Errorf("failed to parse import file: %w", err)
	}

	config := &AppConfig{
		AppConfig:  appConfig,
		configPath: configPath,
	}

	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid imported config: %w", err)
	}

	if err := config.Save(); err != nil {
		return nil, fmt.Errorf("failed to save imported config: %w", err)
	}

	return config, nil
}
