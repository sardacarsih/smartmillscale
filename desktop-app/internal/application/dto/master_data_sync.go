package dto

import "time"

const (
	MasterDataScopeEstate   = "estate"
	MasterDataScopeAfdeling = "afdeling"
	MasterDataScopeBlok     = "blok"
)

// MasterDataSyncRequest represents request to trigger master data sync.
type MasterDataSyncRequest struct {
	TriggerSource string   `json:"triggerSource"` // auto | manual
	Scope         []string `json:"scope,omitempty"`
}

// MasterEntitySyncCount stores per-entity sync counters.
type MasterEntitySyncCount struct {
	Created     int `json:"created"`
	Updated     int `json:"updated"`
	Deactivated int `json:"deactivated"`
	Skipped     int `json:"skipped"`
}

// MasterDataSyncResponse represents the result of a master data sync run.
type MasterDataSyncResponse struct {
	Success       bool                             `json:"success"`
	IsOnline      bool                             `json:"isOnline"`
	TriggerSource string                           `json:"triggerSource"`
	Scope         []string                         `json:"scope"`
	SyncedAt      *time.Time                       `json:"syncedAt,omitempty"`
	Counts        map[string]MasterEntitySyncCount `json:"counts"`
	Error         string                           `json:"error,omitempty"`
}

// MasterDataSyncStatus represents latest persisted sync status to display in UI.
type MasterDataSyncStatus struct {
	SyncInProgress bool                    `json:"syncInProgress"`
	LastAttemptAt  *time.Time              `json:"lastAttemptAt,omitempty"`
	LastSuccessAt  *time.Time              `json:"lastSuccessAt,omitempty"`
	LastResult     *MasterDataSyncResponse `json:"lastResult,omitempty"`
}
