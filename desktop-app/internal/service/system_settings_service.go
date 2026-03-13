package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/models"
	"github.com/yourusername/gosmartmillscale/shared/types"
	"gorm.io/gorm"
)

const globalSystemSettingsKey = "GLOBAL"

// GeneralSettings stores UI-level general preferences.
type GeneralSettings struct {
	SiteName        string `json:"siteName"`
	SiteDescription string `json:"siteDescription"`
	Language        string `json:"language"`
	Timezone        string `json:"timezone"`
	DateFormat      string `json:"dateFormat"`
	TimeFormat      string `json:"timeFormat"`
}

// SystemSettings stores application-level system settings.
type SystemSettings struct {
	AutoBackup       bool   `json:"autoBackup"`
	BackupInterval   string `json:"backupInterval"`
	RetentionDays    int    `json:"retentionDays"`
	SyncEnabled      bool   `json:"syncEnabled"`
	SyncInterval     int    `json:"syncInterval"` // minutes
	SessionTimeout   int    `json:"sessionTimeout"`
	MaxLoginAttempts int    `json:"maxLoginAttempts"`
}

// SerialSettings stores serial-port settings from UI.
type SerialSettings struct {
	Port          string `json:"port"`
	BaudRate      int    `json:"baudRate"`
	DataBits      int    `json:"dataBits"`
	Parity        string `json:"parity"` // none/even/odd/mark/space
	StopBits      int    `json:"stopBits"`
	Timeout       int    `json:"timeout"` // milliseconds
	RetryAttempts int    `json:"retryAttempts"`
}

// SecuritySettings stores persisted security preferences.
type SecuritySettings struct {
	PasswordMinLength        int  `json:"passwordMinLength"`
	PasswordRequireUppercase bool `json:"passwordRequireUppercase"`
	PasswordRequireNumbers   bool `json:"passwordRequireNumbers"`
	PasswordRequireSymbols   bool `json:"passwordRequireSymbols"`
	SessionTimeoutMinutes    int  `json:"sessionTimeoutMinutes"`
	LockScreenAfterMinutes   int  `json:"lockScreenAfterMinutes"`
}

// SystemSettingsPayload is the full persisted settings document.
type SystemSettingsPayload struct {
	General  GeneralSettings     `json:"general"`
	System   SystemSettings      `json:"system"`
	Serial   SerialSettings      `json:"serial"`
	Security SecuritySettings    `json:"security"`
	Company  types.CompanyConfig `json:"company"`
}

// SystemSettingsService handles persistence and migration of settings.
type SystemSettingsService struct {
	legacyConfigPath string
}

// NewSystemSettingsService creates a new settings service.
func NewSystemSettingsService(legacyConfigPath string) *SystemSettingsService {
	return &SystemSettingsService{legacyConfigPath: legacyConfigPath}
}

// DefaultSystemSettings returns canonical default settings.
func DefaultSystemSettings() *SystemSettingsPayload {
	return &SystemSettingsPayload{
		General: GeneralSettings{
			SiteName:        "Smart Mill Scale",
			SiteDescription: "Sistem Manajemen Timbangan Digital",
			Language:        "id",
			Timezone:        "Asia/Jakarta",
			DateFormat:      "DD/MM/YYYY",
			TimeFormat:      "24",
		},
		System: SystemSettings{
			AutoBackup:       true,
			BackupInterval:   "daily",
			RetentionDays:    30,
			SyncEnabled:      true,
			SyncInterval:     5,
			SessionTimeout:   30,
			MaxLoginAttempts: 3,
		},
		Serial: SerialSettings{
			Port:          "COM1",
			BaudRate:      9600,
			DataBits:      8,
			Parity:        "none",
			StopBits:      1,
			Timeout:       5000,
			RetryAttempts: 3,
		},
		Security: SecuritySettings{
			PasswordMinLength:        6,
			PasswordRequireUppercase: false,
			PasswordRequireNumbers:   true,
			PasswordRequireSymbols:   false,
			SessionTimeoutMinutes:    30,
			LockScreenAfterMinutes:   10,
		},
		Company: types.CompanyConfig{
			CompanyName:      "PT. Smart Mill Scale",
			CompanyAddress:   "",
			CompanyPhone:     "",
			CompanyEmail:     "",
			CompanyCode:      "SMS",
			TicketDateFormat: "YYYYMM",
			TicketDigits:     4,
			TicketSeparator:  "-",
		},
	}
}

// GetOrInitSettings gets persisted settings or creates defaults with one-time legacy migration.
func (s *SystemSettingsService) GetOrInitSettings(db *gorm.DB) (*SystemSettingsPayload, error) {
	if db == nil {
		return nil, fmt.Errorf("database is nil")
	}

	if err := db.AutoMigrate(&models.SystemSettingsModel{}); err != nil {
		return nil, fmt.Errorf("failed to migrate system settings table: %w", err)
	}

	var record models.SystemSettingsModel
	err := db.Where("key = ?", globalSystemSettingsKey).First(&record).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to query system settings: %w", err)
		}

		settings := s.migrateFromLegacyConfig(DefaultSystemSettings())
		normalized := s.normalizeSettings(settings)

		payloadJSON, marshalErr := json.Marshal(normalized)
		if marshalErr != nil {
			return nil, fmt.Errorf("failed to marshal initial settings: %w", marshalErr)
		}

		record = models.SystemSettingsModel{
			Key:         globalSystemSettingsKey,
			Version:     1,
			PayloadJSON: string(payloadJSON),
		}

		if createErr := db.Create(&record).Error; createErr != nil {
			return nil, fmt.Errorf("failed to create initial settings: %w", createErr)
		}

		return normalized, nil
	}

	decoded, decodeErr := decodeSystemSettings(record.PayloadJSON)
	if decodeErr != nil {
		// Self-heal malformed payload by resetting to defaults.
		reset := s.normalizeSettings(DefaultSystemSettings())
		if _, updateErr := s.UpdateSettings(db, reset); updateErr != nil {
			return nil, fmt.Errorf("failed to recover malformed settings payload: %w", updateErr)
		}
		return reset, nil
	}

	return s.normalizeSettings(decoded), nil
}

// UpdateSettings validates and upserts the settings payload.
func (s *SystemSettingsService) UpdateSettings(db *gorm.DB, settings *SystemSettingsPayload) (*SystemSettingsPayload, error) {
	if db == nil {
		return nil, fmt.Errorf("database is nil")
	}
	if settings == nil {
		return nil, fmt.Errorf("settings payload is nil")
	}

	if err := db.AutoMigrate(&models.SystemSettingsModel{}); err != nil {
		return nil, fmt.Errorf("failed to migrate system settings table: %w", err)
	}

	normalized := s.normalizeSettings(settings)
	payloadJSON, err := json.Marshal(normalized)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal settings payload: %w", err)
	}

	txErr := db.Transaction(func(tx *gorm.DB) error {
		var record models.SystemSettingsModel
		findErr := tx.Where("key = ?", globalSystemSettingsKey).First(&record).Error
		if findErr != nil {
			if !errors.Is(findErr, gorm.ErrRecordNotFound) {
				return findErr
			}

			newRecord := models.SystemSettingsModel{
				Key:         globalSystemSettingsKey,
				Version:     1,
				PayloadJSON: string(payloadJSON),
			}
			return tx.Create(&newRecord).Error
		}

		record.PayloadJSON = string(payloadJSON)
		record.Version++
		return tx.Save(&record).Error
	})
	if txErr != nil {
		return nil, fmt.Errorf("failed to upsert system settings: %w", txErr)
	}

	return normalized, nil
}

// UpdateSettingsFromJSON validates raw JSON and persists it.
func (s *SystemSettingsService) UpdateSettingsFromJSON(db *gorm.DB, settingsJSON string) (*SystemSettingsPayload, error) {
	var payload SystemSettingsPayload
	if err := json.Unmarshal([]byte(settingsJSON), &payload); err != nil {
		return nil, fmt.Errorf("invalid system settings JSON: %w", err)
	}
	return s.UpdateSettings(db, &payload)
}

// DecodeSettingsJSON decodes raw JSON payload to a struct.
func DecodeSettingsJSON(settingsJSON string) (*SystemSettingsPayload, error) {
	var payload SystemSettingsPayload
	if err := json.Unmarshal([]byte(settingsJSON), &payload); err != nil {
		return nil, err
	}
	return &payload, nil
}

func decodeSystemSettings(payload string) (*SystemSettingsPayload, error) {
	var decoded SystemSettingsPayload
	if err := json.Unmarshal([]byte(payload), &decoded); err != nil {
		return nil, err
	}
	return &decoded, nil
}

func (s *SystemSettingsService) normalizeSettings(input *SystemSettingsPayload) *SystemSettingsPayload {
	defaults := DefaultSystemSettings()
	if input == nil {
		return defaults
	}

	result := *input

	// General
	if strings.TrimSpace(result.General.SiteName) == "" {
		result.General.SiteName = defaults.General.SiteName
	}
	if strings.TrimSpace(result.General.SiteDescription) == "" {
		result.General.SiteDescription = defaults.General.SiteDescription
	}
	if result.General.Language != "id" && result.General.Language != "en" {
		result.General.Language = defaults.General.Language
	}
	if strings.TrimSpace(result.General.Timezone) == "" {
		result.General.Timezone = defaults.General.Timezone
	}
	allowedDateFormats := map[string]bool{"DD/MM/YYYY": true, "MM/DD/YYYY": true, "YYYY-MM-DD": true}
	if !allowedDateFormats[result.General.DateFormat] {
		result.General.DateFormat = defaults.General.DateFormat
	}
	if result.General.TimeFormat != "12" && result.General.TimeFormat != "24" {
		result.General.TimeFormat = defaults.General.TimeFormat
	}

	// System
	allowedBackupIntervals := map[string]bool{"hourly": true, "daily": true, "weekly": true, "monthly": true}
	if !allowedBackupIntervals[result.System.BackupInterval] {
		result.System.BackupInterval = defaults.System.BackupInterval
	}
	if result.System.RetentionDays < 1 || result.System.RetentionDays > 365 {
		result.System.RetentionDays = defaults.System.RetentionDays
	}
	if result.System.SyncInterval < 1 || result.System.SyncInterval > 60 {
		result.System.SyncInterval = defaults.System.SyncInterval
	}
	if result.System.SessionTimeout < 5 || result.System.SessionTimeout > 480 {
		result.System.SessionTimeout = defaults.System.SessionTimeout
	}
	if result.System.MaxLoginAttempts < 1 || result.System.MaxLoginAttempts > 10 {
		result.System.MaxLoginAttempts = defaults.System.MaxLoginAttempts
	}

	// Serial
	if strings.TrimSpace(result.Serial.Port) == "" {
		result.Serial.Port = defaults.Serial.Port
	}
	if result.Serial.BaudRate <= 0 {
		result.Serial.BaudRate = defaults.Serial.BaudRate
	}
	if result.Serial.DataBits != 7 && result.Serial.DataBits != 8 {
		result.Serial.DataBits = defaults.Serial.DataBits
	}
	allowedParity := map[string]bool{"none": true, "even": true, "odd": true, "mark": true, "space": true}
	if !allowedParity[result.Serial.Parity] {
		result.Serial.Parity = defaults.Serial.Parity
	}
	if result.Serial.StopBits != 1 && result.Serial.StopBits != 2 {
		result.Serial.StopBits = defaults.Serial.StopBits
	}
	if result.Serial.Timeout < 100 || result.Serial.Timeout > 30000 {
		result.Serial.Timeout = defaults.Serial.Timeout
	}
	if result.Serial.RetryAttempts < 0 || result.Serial.RetryAttempts > 10 {
		result.Serial.RetryAttempts = defaults.Serial.RetryAttempts
	}

	// Security
	if result.Security.PasswordMinLength < 4 || result.Security.PasswordMinLength > 50 {
		result.Security.PasswordMinLength = defaults.Security.PasswordMinLength
	}
	if result.Security.SessionTimeoutMinutes < 5 || result.Security.SessionTimeoutMinutes > 480 {
		result.Security.SessionTimeoutMinutes = defaults.Security.SessionTimeoutMinutes
	}
	if result.Security.LockScreenAfterMinutes < 1 || result.Security.LockScreenAfterMinutes > 60 {
		result.Security.LockScreenAfterMinutes = defaults.Security.LockScreenAfterMinutes
	}

	// Company
	if strings.TrimSpace(result.Company.CompanyName) == "" {
		result.Company.CompanyName = defaults.Company.CompanyName
	}
	if strings.TrimSpace(result.Company.CompanyCode) == "" {
		result.Company.CompanyCode = defaults.Company.CompanyCode
	}
	result.Company.CompanyCode = strings.ToUpper(strings.TrimSpace(result.Company.CompanyCode))
	if result.Company.TicketDateFormat != "YYMM" && result.Company.TicketDateFormat != "YYYYMM" {
		result.Company.TicketDateFormat = defaults.Company.TicketDateFormat
	}
	if result.Company.TicketDigits < 3 || result.Company.TicketDigits > 5 {
		result.Company.TicketDigits = defaults.Company.TicketDigits
	}
	if strings.TrimSpace(result.Company.TicketSeparator) == "" {
		result.Company.TicketSeparator = defaults.Company.TicketSeparator
	}

	return &result
}

func (s *SystemSettingsService) migrateFromLegacyConfig(defaults *SystemSettingsPayload) *SystemSettingsPayload {
	result := s.normalizeSettings(defaults)
	if strings.TrimSpace(s.legacyConfigPath) == "" {
		return result
	}

	data, err := os.ReadFile(s.legacyConfigPath)
	if err != nil {
		return result
	}

	// Try current config shape first.
	var currentShape struct {
		Weighing types.WeighingConfig `json:"weighing"`
		Sync     types.SyncConfig     `json:"sync"`
		Company  types.CompanyConfig  `json:"company"`
	}
	if err := json.Unmarshal(data, &currentShape); err == nil {
		s.applyLegacyWeighing(&result.Serial, currentShape.Weighing)
		s.applyLegacySync(&result.System, currentShape.Sync)
		if hasCompanyData(currentShape.Company) {
			result.Company = currentShape.Company
		}
	}

	// Try legacy snake_case shape used by previous company config writer.
	var legacyShape struct {
		Company types.CompanyConfig `json:"company"`
	}
	if err := json.Unmarshal(data, &legacyShape); err == nil && hasCompanyData(legacyShape.Company) {
		result.Company = legacyShape.Company
	}

	return s.normalizeSettings(result)
}

func (s *SystemSettingsService) applyLegacySync(target *SystemSettings, legacy types.SyncConfig) {
	if target == nil {
		return
	}
	if legacy.SyncInterval > 0 {
		minutes := int(legacy.SyncInterval / time.Minute)
		if minutes <= 0 {
			minutes = 1
		}
		target.SyncInterval = minutes
		target.SyncEnabled = true
	}
}

func (s *SystemSettingsService) applyLegacyWeighing(target *SerialSettings, legacy types.WeighingConfig) {
	if target == nil {
		return
	}
	if strings.TrimSpace(legacy.COMPort) != "" {
		target.Port = legacy.COMPort
	}
	if legacy.BaudRate > 0 {
		target.BaudRate = legacy.BaudRate
	}
	if legacy.DataBits > 0 {
		target.DataBits = legacy.DataBits
	}
	if legacy.StopBits == 1 || legacy.StopBits == 2 {
		target.StopBits = legacy.StopBits
	}
	if legacy.ReadTimeout > 0 {
		target.Timeout = legacy.ReadTimeout
	}
	if mapped := parityConfigToUI(legacy.Parity); mapped != "" {
		target.Parity = mapped
	}
}

func parityConfigToUI(parity string) string {
	switch strings.ToUpper(strings.TrimSpace(parity)) {
	case "N", "NONE":
		return "none"
	case "E", "EVEN":
		return "even"
	case "O", "ODD":
		return "odd"
	case "M", "MARK":
		return "mark"
	case "S", "SPACE":
		return "space"
	default:
		return ""
	}
}

func hasCompanyData(company types.CompanyConfig) bool {
	if strings.TrimSpace(company.CompanyName) != "" {
		return true
	}
	if strings.TrimSpace(company.CompanyAddress) != "" {
		return true
	}
	if strings.TrimSpace(company.CompanyPhone) != "" {
		return true
	}
	if strings.TrimSpace(company.CompanyEmail) != "" {
		return true
	}
	if strings.TrimSpace(company.CompanyCode) != "" {
		return true
	}
	if strings.TrimSpace(company.TicketDateFormat) != "" {
		return true
	}
	if company.TicketDigits > 0 {
		return true
	}
	if strings.TrimSpace(company.TicketSeparator) != "" {
		return true
	}
	return false
}
