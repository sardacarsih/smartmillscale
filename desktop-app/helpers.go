package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	defaultDatabaseDirName  = "data"
	defaultDatabaseFileName = "smartmillscale.db"
)

// getDeviceID generates a unique device identifier
func getDeviceID() string {
	hostname, _ := os.Hostname()
	return fmt.Sprintf("%s-%s", hostname, runtime.GOOS)
}

// formatError formats an error into a standardized API error response JSON
func formatError(err error) (string, error) {
	if err == nil {
		return "", nil
	}

	type APIError struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}

	apiErr := APIError{
		Code:    "INTERNAL_ERROR",
		Message: err.Error(),
	}

	data, marshalErr := json.Marshal(apiErr)
	if marshalErr != nil {
		return fmt.Sprintf(`{"code":"JSON_ERROR","message":"Failed to marshal error: %v"}`, marshalErr), err
	}

	return string(data), err
}

// EmitSystemEvent emits a generic system event
func (a *App) EmitSystemEvent(eventType string, data interface{}) {
	wailsruntime.EventsEmit(a.ctx, eventType, map[string]interface{}{
		"type":      eventType,
		"data":      data,
		"timestamp": time.Now(),
		"deviceId":  getDeviceID(),
	})
}

// Helper functions for safe type assertions

func getFloatSafely(data map[string]interface{}, key string) float64 {
	if value, exists := data[key]; exists {
		switch v := value.(type) {
		case float64:
			return v
		case float32:
			return float64(v)
		case int:
			return float64(v)
		case int64:
			return float64(v)
		default:
			return 0.0
		}
	}
	return 0.0
}

func getBoolSafely(data map[string]interface{}, key string) bool {
	if value, exists := data[key]; exists {
		if v, ok := value.(bool); ok {
			return v
		}
	}
	return false
}

func getIntSafely(data map[string]interface{}, key string) int {
	if value, exists := data[key]; exists {
		switch v := value.(type) {
		case int:
			return v
		case int64:
			return int(v)
		case float64:
			return int(v)
		case float32:
			return int(v)
		default:
			return 0
		}
	}
	return 0
}

// getAppDataPath returns the application data directory path
func getAppDataPath() string {
	dbPath := getDatabasePath()
	return filepath.Dir(filepath.Dir(dbPath))
}

// Path determination functions moved from app.go

// getDatabasePath returns one canonical database path.
func getDatabasePath() string {
	if projectPath, found := resolveProjectDatabasePath(); found {
		return projectPath
	}

	// Fallback for environments where project markers are unavailable.
	fallback := filepath.Join(".", defaultDatabaseDirName, defaultDatabaseFileName)
	absPath, err := filepath.Abs(fallback)
	if err != nil {
		return filepath.Clean(fallback)
	}
	return absPath
}

func resolveProjectDatabasePath() (string, bool) {
	if cwd, err := os.Getwd(); err == nil {
		if path, found := findProjectDatabasePathFrom(cwd); found {
			return path, true
		}
	}

	exePath, err := os.Executable()
	if err == nil {
		if path, found := findProjectDatabasePathFrom(filepath.Dir(exePath)); found {
			return path, true
		}
	}

	// In `wails dev`, process CWD/executable can be in a temp directory.
	// Use source-file location (if available) to keep DB path stable in project workspace.
	if _, sourceFile, _, ok := runtime.Caller(0); ok {
		if path, found := findProjectDatabasePathFrom(filepath.Dir(sourceFile)); found {
			return path, true
		}
	}

	return "", false
}

func findProjectDatabasePathFrom(startDir string) (string, bool) {
	dir := filepath.Clean(startDir)

	for i := 0; i < 8; i++ {
		// Running from desktop-app (contains wails.json).
		if fileExists(filepath.Join(dir, "wails.json")) {
			return filepath.Join(dir, defaultDatabaseDirName, defaultDatabaseFileName), true
		}

		// Running from repository root (contains desktop-app/wails.json).
		if fileExists(filepath.Join(dir, "desktop-app", "wails.json")) {
			return filepath.Join(dir, "desktop-app", defaultDatabaseDirName, defaultDatabaseFileName), true
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return "", false
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// getConfigFilePath returns the configuration file path
func getConfigFilePath() string {
	// Check for portable mode first
	if isPortableMode() {
		exePath, err := os.Executable()
		if err == nil {
			return filepath.Join(filepath.Dir(exePath), "config.json")
		}
	}

	// Default: Use %LOCALAPPDATA% on Windows
	if runtime.GOOS == "windows" {
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData == "" {
			localAppData = filepath.Join(os.Getenv("USERPROFILE"), "AppData", "Local")
		}
		return filepath.Join(localAppData, "SmartMillScale", "config.json")
	}

	// Fallback for other OS
	return "./config.json"
}

// isPortableMode checks if application should run in portable mode
func isPortableMode() bool {
	// Check for portable mode flag in environment
	if os.Getenv("SMARTMILL_PORTABLE") == "1" {
		return true
	}

	// Check if portable file exists next to executable
	exePath, err := os.Executable()
	if err == nil {
		portableFlagPath := filepath.Join(filepath.Dir(exePath), "portable.txt")
		if _, err := os.Stat(portableFlagPath); err == nil {
			return true
		}
	}

	return false
}

// Config and Server functions moved from app.go

// getServerURL returns the server URL
func getServerURL() string {
	// Check for environment variable first
	if serverURL := os.Getenv("SMARTMILL_SERVER_URL"); serverURL != "" {
		return serverURL
	}

	// Try to read from config file
	if config := loadConfigFile(); config.ServerURL != "" {
		return config.ServerURL
	}

	// Default production server
	return "https://api.smartmillscale.com"
}

// getAPIKey returns the API key
func getAPIKey() string {
	// Check for environment variable first
	if apiKey := os.Getenv("SMARTMILL_API_KEY"); apiKey != "" {
		return apiKey
	}

	// Try to read from config file
	if config := loadConfigFile(); config.APIKey != "" {
		return config.APIKey
	}

	// Return empty for production - should be configured
	return ""
}

// AppConfig represents the application configuration file structure
type AppConfig struct {
	DeviceID  string `json:"device_id"`
	ServerURL string `json:"server_url"`
	APIKey    string `json:"api_key,omitempty"`
	DebugMode bool   `json:"debug_mode,omitempty"`
}

// loadConfigFile loads configuration from file
func loadConfigFile() *AppConfig {
	configPath := getConfigFilePath()

	// Check if config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return &AppConfig{}
	}

	// Read config file
	data, err := os.ReadFile(configPath)
	if err != nil {
		// log.Printf("Warning: Failed to read config file: %v", err)
		fmt.Printf("Warning: Failed to read config file: %v\n", err)
		return &AppConfig{}
	}

	// Parse JSON
	var config AppConfig
	if err := json.Unmarshal(data, &config); err != nil {
		// log.Printf("Warning: Failed to parse config file: %v", err)
		fmt.Printf("Warning: Failed to parse config file: %v\n", err)
		return &AppConfig{}
	}

	return &config
}

// saveConfigFile saves configuration to file
func saveConfigFile(config *AppConfig) error {
	configPath := getConfigFilePath()

	// Ensure directory exists
	configDir := filepath.Dir(configPath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Marshal to JSON
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Write to file
	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}
