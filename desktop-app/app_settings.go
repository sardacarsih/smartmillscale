package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	appconfig "github.com/yourusername/gosmartmillscale/desktop-app/internal/config"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/serial"
	appservice "github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
	"github.com/yourusername/gosmartmillscale/shared/types"
	"gorm.io/gorm"
)

// GetSystemSettings returns the full persisted system settings payload as JSON.
func (a *App) GetSystemSettings() (string, error) {
	db := a.getSettingsDB()
	if db == nil {
		return "", fmt.Errorf("database not initialized")
	}

	settings, err := a.getSettingsService().GetOrInitSettings(db)
	if err != nil {
		return "", err
	}

	payload, err := json.Marshal(settings)
	if err != nil {
		return "", fmt.Errorf("failed to marshal system settings: %w", err)
	}

	return string(payload), nil
}

// UpdateSystemSettings updates and persists the full system settings payload.
func (a *App) UpdateSystemSettings(settingsJSON string) error {
	if err := a.RequireAuthenticatedServices(); err != nil {
		return err
	}

	return a.handler.HandleVoid(func() error {
		db := a.getSettingsDB()
		if db == nil {
			return fmt.Errorf("database not initialized")
		}

		updated, err := a.getSettingsService().UpdateSettingsFromJSON(db, settingsJSON)
		if err != nil {
			return err
		}

		if err := a.applySystemSettingsRuntime(updated); err != nil {
			return err
		}

		return nil
	})
}

func (a *App) getSettingsService() *appservice.SystemSettingsService {
	return appservice.NewSystemSettingsService(appconfig.GetConfigPath())
}

func (a *App) getSettingsDB() *gorm.DB {
	if a.application != nil && a.application.Container != nil && a.application.Container.DB != nil {
		return a.application.Container.DB
	}
	if a.coreApplication != nil && a.coreApplication.Container != nil && a.coreApplication.Container.DB != nil {
		return a.coreApplication.Container.DB
	}
	return nil
}

func (a *App) applySystemSettingsRuntime(settings *appservice.SystemSettingsPayload) error {
	if settings == nil {
		return nil
	}
	if a.application == nil || a.application.Container == nil {
		return nil
	}

	container := a.application.Container

	if container.TicketService != nil {
		container.TicketService.SetCompanyConfig(&settings.Company)
	}

	if container.SyncUseCase != nil {
		nextSync := buildSyncRuntimeConfig(container.SyncUseCase.GetSyncConfig(), settings.System)
		container.SyncUseCase.UpdateSyncConfig(nextSync)
	}

	if container.AppConfig != nil {
		container.AppConfig.Company = settings.Company
		container.AppConfig.Sync.SyncInterval = time.Duration(settings.System.SyncInterval) * time.Minute
		container.AppConfig.Weighing = buildWeighingConfigFromSettingsSerial(settings.Serial, container.AppConfig.Weighing)
	}

	if err := a.applySerialRuntime(settings.Serial); err != nil {
		return fmt.Errorf("settings persisted but failed to apply serial runtime: %w", err)
	}

	return nil
}

func (a *App) applySerialRuntime(serialSettings appservice.SerialSettings) error {
	if a.application == nil || a.application.Container == nil {
		return nil
	}

	monitoringService := a.application.Container.WeightMonitoringService
	if monitoringService == nil {
		return nil
	}

	baseConfig := types.DefaultWeighingConfig()
	if a.application.Container.AppConfig != nil {
		baseConfig = a.application.Container.AppConfig.Weighing
	}

	weighingConfig := buildWeighingConfigFromSettingsSerial(serialSettings, baseConfig)
	if err := serial.ValidateSerialConfig(weighingConfig); err != nil {
		return err
	}

	reader, err := serial.CreateSerialReader(weighingConfig)
	if err != nil {
		return err
	}

	wasMonitoring := monitoringService.IsMonitoring()
	if wasMonitoring {
		if err := monitoringService.StopMonitoring(); err != nil {
			return err
		}
	} else {
		if err := monitoringService.StopSerialReader(); err != nil {
			return err
		}
	}

	monitoringService.SetSerialReader(reader)

	if wasMonitoring {
		return monitoringService.StartMonitoring()
	}

	return monitoringService.StartSerialReader()
}

func buildSyncRuntimeConfig(current *dto.SyncConfig, systemSettings appservice.SystemSettings) *dto.SyncConfig {
	next := &dto.SyncConfig{}
	if current != nil {
		*next = *current
	}

	next.AutoSyncEnabled = systemSettings.SyncEnabled
	next.SyncInterval = systemSettings.SyncInterval * 60
	if next.SyncInterval <= 0 {
		next.SyncInterval = 300
	}
	if next.MaxRetries <= 0 {
		next.MaxRetries = 3
	}
	if next.RetryDelay <= 0 {
		next.RetryDelay = 60
	}
	if next.BatchSize <= 0 {
		next.BatchSize = 50
	}
	if next.Timeout <= 0 {
		next.Timeout = 30
	}

	return next
}

func buildWeighingConfigFromSettingsSerial(serialSettings appservice.SerialSettings, base types.WeighingConfig) types.WeighingConfig {
	config := base
	config.COMPort = strings.TrimSpace(serialSettings.Port)
	if config.COMPort == "" {
		config.COMPort = "COM1"
	}

	if serialSettings.BaudRate > 0 {
		config.BaudRate = serialSettings.BaudRate
	}
	if serialSettings.DataBits > 0 {
		config.DataBits = serialSettings.DataBits
	}
	if serialSettings.StopBits == 1 || serialSettings.StopBits == 2 {
		config.StopBits = serialSettings.StopBits
	}
	if serialSettings.Timeout > 0 {
		config.ReadTimeout = serialSettings.Timeout
		config.WriteTimeout = serialSettings.Timeout
	}
	config.Parity = mapParityUIToConfig(serialSettings.Parity)

	return config
}

func mapParityUIToConfig(parity string) string {
	switch strings.ToLower(strings.TrimSpace(parity)) {
	case "even":
		return "E"
	case "odd":
		return "O"
	case "mark":
		return "M"
	case "space":
		return "S"
	default:
		return "N"
	}
}
