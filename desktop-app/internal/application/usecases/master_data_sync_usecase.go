package usecases

import (
	"context"
	"errors"
	"fmt"
	"strings"
	stdsync "sync"
	"sync/atomic"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	syncpkg "github.com/yourusername/gosmartmillscale/desktop-app/internal/sync"
	"gorm.io/gorm"
)

var (
	ErrMasterDataSyncInProgress = errors.New("master data sync already in progress")
)

type masterSyncClientFactory interface {
	GetActiveClient(ctx context.Context) (*syncpkg.GraphQLClient, error)
}

// MasterDataSyncUseCase handles synchronization of PKS master reference data.
type MasterDataSyncUseCase struct {
	db            *gorm.DB
	clientFactory masterSyncClientFactory

	inProgress atomic.Bool
	statusMu   stdsync.RWMutex
	status     dto.MasterDataSyncStatus
}

// NewMasterDataSyncUseCase creates a new master data sync use case.
func NewMasterDataSyncUseCase(db *gorm.DB, clientFactory masterSyncClientFactory) *MasterDataSyncUseCase {
	return &MasterDataSyncUseCase{
		db:            db,
		clientFactory: clientFactory,
	}
}

// TriggerMasterDataSync triggers a master data synchronization with server-priority merge.
func (uc *MasterDataSyncUseCase) TriggerMasterDataSync(ctx context.Context, req *dto.MasterDataSyncRequest) (*dto.MasterDataSyncResponse, error) {
	if uc == nil || uc.db == nil {
		return nil, fmt.Errorf("master data sync use case is not initialized")
	}
	if uc.clientFactory == nil {
		return nil, fmt.Errorf("master data sync client factory is not initialized")
	}

	if !uc.inProgress.CompareAndSwap(false, true) {
		return nil, ErrMasterDataSyncInProgress
	}
	defer uc.inProgress.Store(false)

	normalizedReq := normalizeMasterSyncRequest(req)
	response := &dto.MasterDataSyncResponse{
		Success:       false,
		IsOnline:      false,
		TriggerSource: normalizedReq.TriggerSource,
		Scope:         normalizedReq.Scope,
		Counts:        newEmptyMasterCounts(),
	}

	attemptAt := time.Now()
	defer uc.updateStatus(response, attemptAt)

	client, err := uc.clientFactory.GetActiveClient(ctx)
	if err != nil {
		response.Error = fmt.Sprintf("failed to get active sync client: %v", err)
		return response, nil
	}

	healthCtx, cancelHealth := context.WithTimeout(ctx, 5*time.Second)
	healthErr := client.HealthCheck(healthCtx)
	cancelHealth()
	if healthErr != nil {
		response.Error = fmt.Sprintf("server is unreachable: %v", healthErr)
		return response, nil
	}
	response.IsOnline = true

	fetchCtx, cancelFetch := context.WithTimeout(ctx, 45*time.Second)
	serverData, fetchErr := client.FetchMasterReferenceData(fetchCtx)
	cancelFetch()
	if fetchErr != nil {
		response.Error = fmt.Sprintf("failed to fetch master data from server: %v", fetchErr)
		return response, nil
	}

	syncedAt := time.Now()
	txErr := uc.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if containsScope(normalizedReq.Scope, dto.MasterDataScopeEstate) {
			if err := uc.mergeEstates(tx, serverData.Estates, syncedAt, response.Counts); err != nil {
				return err
			}
		}
		if containsScope(normalizedReq.Scope, dto.MasterDataScopeAfdeling) {
			if err := uc.mergeAfdelings(tx, serverData.Afdelings, syncedAt, response.Counts); err != nil {
				return err
			}
		}
		if containsScope(normalizedReq.Scope, dto.MasterDataScopeBlok) {
			if err := uc.mergeBloks(tx, serverData.Bloks, syncedAt, response.Counts); err != nil {
				return err
			}
		}
		return nil
	})
	if txErr != nil {
		response.Error = fmt.Sprintf("failed to merge master data: %v", txErr)
		return response, nil
	}

	response.Success = true
	response.SyncedAt = &syncedAt
	response.Error = ""
	return response, nil
}

// GetMasterDataSyncStatus returns the latest master sync status snapshot.
func (uc *MasterDataSyncUseCase) GetMasterDataSyncStatus(ctx context.Context) (*dto.MasterDataSyncStatus, error) {
	_ = ctx
	if uc == nil {
		return nil, fmt.Errorf("master data sync use case is not initialized")
	}

	uc.statusMu.RLock()
	defer uc.statusMu.RUnlock()

	statusCopy := dto.MasterDataSyncStatus{
		SyncInProgress: uc.inProgress.Load(),
		LastAttemptAt:  cloneTimePtr(uc.status.LastAttemptAt),
		LastSuccessAt:  cloneTimePtr(uc.status.LastSuccessAt),
		LastResult:     cloneMasterSyncResponse(uc.status.LastResult),
	}
	return &statusCopy, nil
}

func (uc *MasterDataSyncUseCase) updateStatus(result *dto.MasterDataSyncResponse, attemptAt time.Time) {
	uc.statusMu.Lock()
	defer uc.statusMu.Unlock()

	uc.status.LastAttemptAt = cloneTimePtr(&attemptAt)
	uc.status.SyncInProgress = uc.inProgress.Load()
	uc.status.LastResult = cloneMasterSyncResponse(result)

	if result != nil && result.Success && result.SyncedAt != nil {
		uc.status.LastSuccessAt = cloneTimePtr(result.SyncedAt)
	}
}

func (uc *MasterDataSyncUseCase) mergeEstates(
	tx *gorm.DB,
	records []syncpkg.MasterEstateReference,
	syncedAt time.Time,
	counts map[string]dto.MasterEntitySyncCount,
) error {
	seenKeys := make(map[string]struct{}, len(records))
	entityKey := dto.MasterDataScopeEstate
	counter := counts[entityKey]

	for _, record := range records {
		kodeEstate := normalizeCode(record.KodeEstate)
		if kodeEstate == "" {
			counter.Skipped++
			continue
		}

		seenKeys[kodeEstate] = struct{}{}

		var estate database.MasterEstate
		err := tx.Where("LOWER(kode_estate) = ?", strings.ToLower(kodeEstate)).First(&estate).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("failed to query estate %s: %w", kodeEstate, err)
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			estate = database.MasterEstate{
				KodeEstate:      kodeEstate,
				NamaEstate:      strings.TrimSpace(record.NamaEstate),
				Luas:            record.Luas,
				Lokasi:          strings.TrimSpace(record.Lokasi),
				IsActive:        record.IsActive,
				DataSource:      database.MasterDataSourceServer,
				LastSyncedAt:    &syncedAt,
				ServerUpdatedAt: cloneTimePtr(record.ServerUpdatedAt),
			}
			if err := tx.Create(&estate).Error; err != nil {
				return fmt.Errorf("failed to create estate %s: %w", kodeEstate, err)
			}
			counter.Created++
			continue
		}

		estate.KodeEstate = kodeEstate
		estate.NamaEstate = strings.TrimSpace(record.NamaEstate)
		estate.Luas = record.Luas
		estate.Lokasi = strings.TrimSpace(record.Lokasi)
		estate.IsActive = record.IsActive
		estate.DataSource = database.MasterDataSourceServer
		estate.LastSyncedAt = &syncedAt
		estate.ServerUpdatedAt = cloneTimePtr(record.ServerUpdatedAt)
		if err := tx.Save(&estate).Error; err != nil {
			return fmt.Errorf("failed to update estate %s: %w", kodeEstate, err)
		}
		counter.Updated++
	}

	var serverEstates []database.MasterEstate
	if err := tx.Where("data_source = ?", database.MasterDataSourceServer).Find(&serverEstates).Error; err != nil {
		return fmt.Errorf("failed to fetch server estates for deactivation: %w", err)
	}
	for i := range serverEstates {
		kode := normalizeCode(serverEstates[i].KodeEstate)
		if _, exists := seenKeys[kode]; exists {
			continue
		}
		if !serverEstates[i].IsActive {
			continue
		}
		if err := tx.Model(&database.MasterEstate{}).
			Where("id = ?", serverEstates[i].ID).
			Updates(map[string]interface{}{
				"is_active":      false,
				"last_synced_at": syncedAt,
			}).Error; err != nil {
			return fmt.Errorf("failed to deactivate stale estate %s: %w", serverEstates[i].KodeEstate, err)
		}
		counter.Deactivated++
	}

	counts[entityKey] = counter
	return nil
}

func (uc *MasterDataSyncUseCase) mergeAfdelings(
	tx *gorm.DB,
	records []syncpkg.MasterAfdelingReference,
	syncedAt time.Time,
	counts map[string]dto.MasterEntitySyncCount,
) error {
	seenKeys := make(map[string]struct{}, len(records))
	entityKey := dto.MasterDataScopeAfdeling
	counter := counts[entityKey]

	for _, record := range records {
		kodeEstate := normalizeCode(record.KodeEstate)
		kodeAfdeling := normalizeCode(record.KodeAfdeling)
		if kodeEstate == "" || kodeAfdeling == "" {
			counter.Skipped++
			continue
		}

		var estate database.MasterEstate
		err := tx.Where("LOWER(kode_estate) = ?", strings.ToLower(kodeEstate)).First(&estate).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				counter.Skipped++
				continue
			}
			return fmt.Errorf("failed to query estate for afdeling %s/%s: %w", kodeEstate, kodeAfdeling, err)
		}

		seenKey := fmt.Sprintf("%s::%s", strings.ToLower(kodeEstate), strings.ToLower(kodeAfdeling))
		seenKeys[seenKey] = struct{}{}

		var afdeling database.MasterAfdeling
		err = tx.Joins("JOIN master_estate ON master_estate.id = master_afdeling.id_estate").
			Where("LOWER(master_estate.kode_estate) = ? AND LOWER(master_afdeling.kode_afdeling) = ?", strings.ToLower(kodeEstate), strings.ToLower(kodeAfdeling)).
			First(&afdeling).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("failed to query afdeling %s/%s: %w", kodeEstate, kodeAfdeling, err)
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			afdeling = database.MasterAfdeling{
				IDEstate:        estate.ID,
				KodeAfdeling:    kodeAfdeling,
				NamaAfdeling:    strings.TrimSpace(record.NamaAfdeling),
				Luas:            record.Luas,
				IsActive:        record.IsActive,
				DataSource:      database.MasterDataSourceServer,
				LastSyncedAt:    &syncedAt,
				ServerUpdatedAt: cloneTimePtr(record.ServerUpdatedAt),
			}
			if err := tx.Create(&afdeling).Error; err != nil {
				return fmt.Errorf("failed to create afdeling %s/%s: %w", kodeEstate, kodeAfdeling, err)
			}
			counter.Created++
			continue
		}

		afdeling.IDEstate = estate.ID
		afdeling.KodeAfdeling = kodeAfdeling
		afdeling.NamaAfdeling = strings.TrimSpace(record.NamaAfdeling)
		afdeling.Luas = record.Luas
		afdeling.IsActive = record.IsActive
		afdeling.DataSource = database.MasterDataSourceServer
		afdeling.LastSyncedAt = &syncedAt
		afdeling.ServerUpdatedAt = cloneTimePtr(record.ServerUpdatedAt)
		if err := tx.Save(&afdeling).Error; err != nil {
			return fmt.Errorf("failed to update afdeling %s/%s: %w", kodeEstate, kodeAfdeling, err)
		}
		counter.Updated++
	}

	var serverAfdelings []database.MasterAfdeling
	if err := tx.Preload("Estate").Where("master_afdeling.data_source = ?", database.MasterDataSourceServer).Find(&serverAfdelings).Error; err != nil {
		return fmt.Errorf("failed to fetch server afdelings for deactivation: %w", err)
	}
	for i := range serverAfdelings {
		estateCode := normalizeCode(serverAfdelings[i].Estate.KodeEstate)
		afdelingCode := normalizeCode(serverAfdelings[i].KodeAfdeling)
		if estateCode == "" || afdelingCode == "" {
			continue
		}
		key := fmt.Sprintf("%s::%s", strings.ToLower(estateCode), strings.ToLower(afdelingCode))
		if _, exists := seenKeys[key]; exists {
			continue
		}
		if !serverAfdelings[i].IsActive {
			continue
		}
		if err := tx.Model(&database.MasterAfdeling{}).
			Where("id = ?", serverAfdelings[i].ID).
			Updates(map[string]interface{}{
				"is_active":      false,
				"last_synced_at": syncedAt,
			}).Error; err != nil {
			return fmt.Errorf("failed to deactivate stale afdeling %s/%s: %w", estateCode, afdelingCode, err)
		}
		counter.Deactivated++
	}

	counts[entityKey] = counter
	return nil
}

func (uc *MasterDataSyncUseCase) mergeBloks(
	tx *gorm.DB,
	records []syncpkg.MasterBlokReference,
	syncedAt time.Time,
	counts map[string]dto.MasterEntitySyncCount,
) error {
	seenKeys := make(map[string]struct{}, len(records))
	entityKey := dto.MasterDataScopeBlok
	counter := counts[entityKey]

	for _, record := range records {
		kodeEstate := normalizeCode(record.KodeEstate)
		kodeAfdeling := normalizeCode(record.KodeAfdeling)
		kodeBlok := normalizeCode(record.KodeBlok)
		if kodeEstate == "" || kodeAfdeling == "" || kodeBlok == "" {
			counter.Skipped++
			continue
		}

		var afdeling database.MasterAfdeling
		err := tx.Joins("JOIN master_estate ON master_estate.id = master_afdeling.id_estate").
			Where("LOWER(master_estate.kode_estate) = ? AND LOWER(master_afdeling.kode_afdeling) = ?", strings.ToLower(kodeEstate), strings.ToLower(kodeAfdeling)).
			First(&afdeling).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				counter.Skipped++
				continue
			}
			return fmt.Errorf("failed to query afdeling for blok %s/%s/%s: %w", kodeEstate, kodeAfdeling, kodeBlok, err)
		}

		seenKey := fmt.Sprintf("%s::%s::%s", strings.ToLower(kodeEstate), strings.ToLower(kodeAfdeling), strings.ToLower(kodeBlok))
		seenKeys[seenKey] = struct{}{}

		var blok database.MasterBlok
		err = tx.Joins("JOIN master_afdeling ON master_afdeling.id = master_blok.id_afdeling").
			Joins("JOIN master_estate ON master_estate.id = master_afdeling.id_estate").
			Where("LOWER(master_estate.kode_estate) = ? AND LOWER(master_afdeling.kode_afdeling) = ? AND LOWER(master_blok.kode_blok) = ?", strings.ToLower(kodeEstate), strings.ToLower(kodeAfdeling), strings.ToLower(kodeBlok)).
			First(&blok).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("failed to query blok %s/%s/%s: %w", kodeEstate, kodeAfdeling, kodeBlok, err)
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			blok = database.MasterBlok{
				IDAfdeling:      afdeling.ID,
				KodeBlok:        kodeBlok,
				NamaBlok:        strings.TrimSpace(record.NamaBlok),
				Luas:            record.Luas,
				IsActive:        record.IsActive,
				DataSource:      database.MasterDataSourceServer,
				LastSyncedAt:    &syncedAt,
				ServerUpdatedAt: cloneTimePtr(record.ServerUpdatedAt),
			}
			if err := tx.Create(&blok).Error; err != nil {
				return fmt.Errorf("failed to create blok %s/%s/%s: %w", kodeEstate, kodeAfdeling, kodeBlok, err)
			}
			counter.Created++
			continue
		}

		blok.IDAfdeling = afdeling.ID
		blok.KodeBlok = kodeBlok
		blok.NamaBlok = strings.TrimSpace(record.NamaBlok)
		blok.Luas = record.Luas
		blok.IsActive = record.IsActive
		blok.DataSource = database.MasterDataSourceServer
		blok.LastSyncedAt = &syncedAt
		blok.ServerUpdatedAt = cloneTimePtr(record.ServerUpdatedAt)
		if err := tx.Save(&blok).Error; err != nil {
			return fmt.Errorf("failed to update blok %s/%s/%s: %w", kodeEstate, kodeAfdeling, kodeBlok, err)
		}
		counter.Updated++
	}

	var serverBloks []database.MasterBlok
	if err := tx.Preload("Afdeling").Preload("Afdeling.Estate").Where("master_blok.data_source = ?", database.MasterDataSourceServer).Find(&serverBloks).Error; err != nil {
		return fmt.Errorf("failed to fetch server bloks for deactivation: %w", err)
	}
	for i := range serverBloks {
		estateCode := normalizeCode(serverBloks[i].Afdeling.Estate.KodeEstate)
		afdelingCode := normalizeCode(serverBloks[i].Afdeling.KodeAfdeling)
		blokCode := normalizeCode(serverBloks[i].KodeBlok)
		if estateCode == "" || afdelingCode == "" || blokCode == "" {
			continue
		}
		key := fmt.Sprintf("%s::%s::%s", strings.ToLower(estateCode), strings.ToLower(afdelingCode), strings.ToLower(blokCode))
		if _, exists := seenKeys[key]; exists {
			continue
		}
		if !serverBloks[i].IsActive {
			continue
		}
		if err := tx.Model(&database.MasterBlok{}).
			Where("id = ?", serverBloks[i].ID).
			Updates(map[string]interface{}{
				"is_active":      false,
				"last_synced_at": syncedAt,
			}).Error; err != nil {
			return fmt.Errorf("failed to deactivate stale blok %s/%s/%s: %w", estateCode, afdelingCode, blokCode, err)
		}
		counter.Deactivated++
	}

	counts[entityKey] = counter
	return nil
}

func normalizeMasterSyncRequest(req *dto.MasterDataSyncRequest) *dto.MasterDataSyncRequest {
	normalized := &dto.MasterDataSyncRequest{
		TriggerSource: "manual",
		Scope:         []string{dto.MasterDataScopeEstate, dto.MasterDataScopeAfdeling, dto.MasterDataScopeBlok},
	}
	if req == nil {
		return normalized
	}

	source := strings.ToLower(strings.TrimSpace(req.TriggerSource))
	if source == "auto" || source == "manual" {
		normalized.TriggerSource = source
	}

	if len(req.Scope) == 0 {
		return normalized
	}

	allowed := map[string]struct{}{
		dto.MasterDataScopeEstate:   {},
		dto.MasterDataScopeAfdeling: {},
		dto.MasterDataScopeBlok:     {},
	}
	uniq := make(map[string]struct{}, len(req.Scope))
	normalized.Scope = make([]string, 0, len(req.Scope))
	for _, scopeItem := range req.Scope {
		normalizedItem := strings.ToLower(strings.TrimSpace(scopeItem))
		if _, ok := allowed[normalizedItem]; !ok {
			continue
		}
		if _, exists := uniq[normalizedItem]; exists {
			continue
		}
		uniq[normalizedItem] = struct{}{}
		normalized.Scope = append(normalized.Scope, normalizedItem)
	}
	if len(normalized.Scope) == 0 {
		normalized.Scope = []string{dto.MasterDataScopeEstate, dto.MasterDataScopeAfdeling, dto.MasterDataScopeBlok}
	}

	return normalized
}

func containsScope(scopes []string, target string) bool {
	target = strings.ToLower(strings.TrimSpace(target))
	for _, scope := range scopes {
		if strings.ToLower(strings.TrimSpace(scope)) == target {
			return true
		}
	}
	return false
}

func normalizeCode(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func cloneTimePtr(source *time.Time) *time.Time {
	if source == nil {
		return nil
	}
	cloned := *source
	return &cloned
}

func cloneMasterSyncResponse(source *dto.MasterDataSyncResponse) *dto.MasterDataSyncResponse {
	if source == nil {
		return nil
	}
	clone := *source
	clone.SyncedAt = cloneTimePtr(source.SyncedAt)
	clone.Scope = append([]string{}, source.Scope...)
	clone.Counts = make(map[string]dto.MasterEntitySyncCount, len(source.Counts))
	for key, value := range source.Counts {
		clone.Counts[key] = value
	}
	return &clone
}

func newEmptyMasterCounts() map[string]dto.MasterEntitySyncCount {
	return map[string]dto.MasterEntitySyncCount{
		dto.MasterDataScopeEstate:   {},
		dto.MasterDataScopeAfdeling: {},
		dto.MasterDataScopeBlok:     {},
	}
}
