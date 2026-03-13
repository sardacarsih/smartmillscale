package main

import (
	"encoding/json"
	"fmt"

	"github.com/yourusername/gosmartmillscale/shared/types"
)

// GetCompanyConfig returns company settings as JSON.
// Backward-compatible method: now backed by system_settings table.
func (a *App) GetCompanyConfig() (string, error) {
	db := a.getSettingsDB()
	if db == nil {
		return "{}", fmt.Errorf("database not initialized")
	}

	settings, err := a.getSettingsService().GetOrInitSettings(db)
	if err != nil {
		return "{}", err
	}

	companyJSON, err := json.Marshal(settings.Company)
	if err != nil {
		return "{}", fmt.Errorf("failed to marshal company config: %w", err)
	}

	return string(companyJSON), nil
}

// UpdateCompanyConfig updates company settings from JSON.
// Backward-compatible method: now backed by system_settings table.
func (a *App) UpdateCompanyConfig(configJSON string) error {
	var company types.CompanyConfig
	if err := json.Unmarshal([]byte(configJSON), &company); err != nil {
		return fmt.Errorf("invalid company config JSON: %w", err)
	}

	db := a.getSettingsDB()
	if db == nil {
		return fmt.Errorf("database not initialized")
	}

	settingsSvc := a.getSettingsService()
	settings, err := settingsSvc.GetOrInitSettings(db)
	if err != nil {
		return err
	}

	settings.Company = company
	updated, err := settingsSvc.UpdateSettings(db, settings)
	if err != nil {
		return fmt.Errorf("failed to persist company config: %w", err)
	}

	if a.servicesReady && a.application != nil && a.application.Container != nil {
		if a.application.Container.TicketService != nil {
			a.application.Container.TicketService.SetCompanyConfig(&updated.Company)
		}
		if a.application.Container.AppConfig != nil {
			a.application.Container.AppConfig.Company = updated.Company
		}
	}

	return nil
}
