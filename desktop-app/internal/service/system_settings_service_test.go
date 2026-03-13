package service

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

func TestSystemSettingsService_GetOrInitSettings_MigratesLegacyConfig(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "settings.db")
	db, err := database.NewCGOFreeConnection(dbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("failed to get sql.DB: %v", err)
	}
	defer sqlDB.Close()

	legacyPath := filepath.Join(t.TempDir(), "config.json")
	legacyConfig := types.AppConfig{
		Weighing: types.WeighingConfig{
			COMPort:     "COM9",
			BaudRate:    19200,
			DataBits:    7,
			StopBits:    2,
			Parity:      "E",
			ReadTimeout: 1500,
		},
		Sync: types.SyncConfig{
			SyncInterval: 10 * time.Minute,
		},
		Company: types.CompanyConfig{
			CompanyName:      "PT Legacy",
			CompanyCode:      "LGC",
			TicketDateFormat: "YYMM",
			TicketDigits:     5,
			TicketSeparator:  "/",
		},
	}

	legacyBytes, err := json.Marshal(legacyConfig)
	if err != nil {
		t.Fatalf("failed to marshal legacy config: %v", err)
	}
	if err := os.WriteFile(legacyPath, legacyBytes, 0644); err != nil {
		t.Fatalf("failed to write legacy config: %v", err)
	}

	svc := NewSystemSettingsService(legacyPath)
	settings, err := svc.GetOrInitSettings(db)
	if err != nil {
		t.Fatalf("GetOrInitSettings failed: %v", err)
	}

	if settings.Company.CompanyName != "PT Legacy" {
		t.Fatalf("expected company name from legacy config, got %q", settings.Company.CompanyName)
	}
	if settings.Serial.Port != "COM9" {
		t.Fatalf("expected serial port COM9, got %q", settings.Serial.Port)
	}
	if settings.Serial.Parity != "even" {
		t.Fatalf("expected parity mapping to even, got %q", settings.Serial.Parity)
	}
	if settings.System.SyncInterval != 10 {
		t.Fatalf("expected sync interval 10 minutes, got %d", settings.System.SyncInterval)
	}

	var count int64
	if err := db.Table("system_settings").Count(&count).Error; err != nil {
		t.Fatalf("failed to count system_settings rows: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 system_settings row, got %d", count)
	}
}

func TestSystemSettingsService_UpdateSettings_RoundTrip(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "settings.db")
	db, err := database.NewCGOFreeConnection(dbPath)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("failed to get sql.DB: %v", err)
	}
	defer sqlDB.Close()

	svc := NewSystemSettingsService(filepath.Join(t.TempDir(), "missing-config.json"))
	settings, err := svc.GetOrInitSettings(db)
	if err != nil {
		t.Fatalf("GetOrInitSettings failed: %v", err)
	}

	settings.General.Language = "en"
	settings.System.SyncEnabled = false
	settings.System.SyncInterval = 20
	settings.Serial.Port = "COM11"
	settings.Serial.StopBits = 2
	settings.Security.PasswordMinLength = 9
	settings.Company.CompanyName = "PT Persisted"

	updated, err := svc.UpdateSettings(db, settings)
	if err != nil {
		t.Fatalf("UpdateSettings failed: %v", err)
	}

	if updated.General.Language != "en" {
		t.Fatalf("expected updated language en, got %q", updated.General.Language)
	}

	reloaded, err := svc.GetOrInitSettings(db)
	if err != nil {
		t.Fatalf("GetOrInitSettings after update failed: %v", err)
	}

	if reloaded.Company.CompanyName != "PT Persisted" {
		t.Fatalf("expected persisted company name, got %q", reloaded.Company.CompanyName)
	}
	if reloaded.Serial.Port != "COM11" {
		t.Fatalf("expected persisted serial port COM11, got %q", reloaded.Serial.Port)
	}
	if reloaded.System.SyncInterval != 20 {
		t.Fatalf("expected persisted sync interval 20, got %d", reloaded.System.SyncInterval)
	}
}
