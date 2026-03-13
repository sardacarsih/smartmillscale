package main

import (
	"testing"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	appservice "github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

func TestBuildSyncRuntimeConfig_MapsMinutesToSeconds(t *testing.T) {
	current := &dto.SyncConfig{
		MaxRetries: 5,
		RetryDelay: 90,
		BatchSize:  100,
		Timeout:    45,
	}

	system := appservice.SystemSettings{
		SyncEnabled:  false,
		SyncInterval: 7,
	}

	next := buildSyncRuntimeConfig(current, system)

	if next.SyncInterval != 420 {
		t.Fatalf("expected 420 seconds sync interval, got %d", next.SyncInterval)
	}
	if next.AutoSyncEnabled {
		t.Fatalf("expected AutoSyncEnabled false")
	}
	if next.MaxRetries != 5 {
		t.Fatalf("expected MaxRetries to be preserved, got %d", next.MaxRetries)
	}
}

func TestBuildWeighingConfigFromSettingsSerial_MapsParityAndFields(t *testing.T) {
	base := types.DefaultWeighingConfig()
	base.MockSerialEnabled = true

	serialSettings := appservice.SerialSettings{
		Port:     " COM4 ",
		BaudRate: 115200,
		DataBits: 7,
		Parity:   "odd",
		StopBits: 2,
		Timeout:  1200,
	}

	config := buildWeighingConfigFromSettingsSerial(serialSettings, base)

	if config.COMPort != "COM4" {
		t.Fatalf("expected COM4, got %q", config.COMPort)
	}
	if config.BaudRate != 115200 {
		t.Fatalf("expected 115200 baud, got %d", config.BaudRate)
	}
	if config.DataBits != 7 {
		t.Fatalf("expected data bits 7, got %d", config.DataBits)
	}
	if config.Parity != "O" {
		t.Fatalf("expected parity O, got %q", config.Parity)
	}
	if config.StopBits != 2 {
		t.Fatalf("expected stop bits 2, got %d", config.StopBits)
	}
	if config.ReadTimeout != 1200 || config.WriteTimeout != 1200 {
		t.Fatalf("expected timeout 1200 for read/write, got read=%d write=%d", config.ReadTimeout, config.WriteTimeout)
	}
	if !config.MockSerialEnabled {
		t.Fatalf("expected MockSerialEnabled to be preserved")
	}
}
