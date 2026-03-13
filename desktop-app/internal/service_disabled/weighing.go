package service

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/serial"
	"github.com/yourusername/gosmartmillscale/shared/types"
	"github.com/yourusername/gosmartmillscale/shared/utils"
)

// WeighingService handles weighing operations
type WeighingService struct {
	db       *gorm.DB
	deviceID uuid.UUID
	config   types.AppConfig
}

// NewWeighingService creates a new weighing service
func NewWeighingService(db *gorm.DB, config types.AppConfig) *WeighingService {
	return &WeighingService{
		db:       db,
		deviceID: config.DeviceID,
		config:   config,
	}
}

// RecordWeighing records a new weighing operation using transactional outbox pattern
// This ensures atomic writes to both timbangan and sync_queue tables
func (s *WeighingService) RecordWeighing(nomorKendaraan string, beratKotor int, beratBersih int) (*database.Timbangan, error) {
	// Validate input
	if err := s.validateWeighingInput(nomorKendaraan, beratKotor, beratBersih); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Begin transaction
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	// Ensure rollback on error
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("Transaction rolled back due to panic: %v", r)
		}
	}()

	// Create weighing record
	now := time.Now()
	idLocal := uuid.New()

	timbangan := &database.Timbangan{
		IDLocal:        idLocal,
		NomorKendaraan: nomorKendaraan,
		BeratKotor:     beratKotor,
		BeratBersih:    beratBersih,
		Tanggal:        now,
		StatusSync:     string(types.SyncStatusPending),
		SyncVersion:    1,
		DeviceID:       s.deviceID.String(),
	}

	// Insert timbangan record
	if err := tx.Create(timbangan).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create timbangan record: %w", err)
	}

	// Generate idempotency key
	idempotencyKey := utils.GenerateIdempotencyKey(
		s.deviceID.String(),
		nomorKendaraan,
		beratKotor,
		now,
	)

	// Prepare payload for sync queue
	timbanganData := types.TimbanganData{
		IDLocal:        idLocal,
		NomorKendaraan: nomorKendaraan,
		BeratKotor:     beratKotor,
		BeratBersih:    beratBersih,
		Tanggal:        now,
		IdempotencyKey: idempotencyKey,
		ClientVersion:  1,
		DeviceID:       s.deviceID.String(),
	}

	payloadJSON, err := json.Marshal(timbanganData)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create sync queue entry
	syncQueue := &database.SyncQueue{
		EntityType:     "timbangan",
		EntityID:       idLocal,
		PayloadJSON:    string(payloadJSON),
		Status:         string(types.QueueStatusPending),
		RetryCount:     0,
		MaxRetries:     s.config.Sync.MaxRetries,
		IdempotencyKey: idempotencyKey,
	}

	if err := tx.Create(syncQueue).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create sync queue entry: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("Weighing recorded successfully: ID=%s, Vehicle=%s, Gross=%d, Net=%d",
		idLocal.String(), nomorKendaraan, beratKotor, beratBersih)

	return timbangan, nil
}

// RecordWeighingFromSerial processes weight data from serial port and records it
func (s *WeighingService) RecordWeighingFromSerial(weightData serial.WeightData, nomorKendaraan string) (*database.Timbangan, error) {
	// Validate that weight is stable before recording
	if !weightData.Stable {
		return nil, fmt.Errorf("weight reading is not stable")
	}

	// For now, assume gross weight = net weight (can be extended later)
	beratKotor := weightData.Weight
	beratBersih := weightData.Weight

	return s.RecordWeighing(nomorKendaraan, beratKotor, beratBersih)
}

// GetPendingSyncRecords returns all records pending synchronization
func (s *WeighingService) GetPendingSyncRecords(limit int) ([]database.Timbangan, error) {
	var records []database.Timbangan

	err := s.db.Where("status_sync IN ?", []string{
		string(types.SyncStatusPending),
		string(types.SyncStatusFailed),
	}).
		Order("created_at ASC").
		Limit(limit).
		Find(&records).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get pending sync records: %w", err)
	}

	return records, nil
}

// GetRecentWeighings returns recent weighing records
func (s *WeighingService) GetRecentWeighings(limit int) ([]database.Timbangan, error) {
	var records []database.Timbangan

	err := s.db.Order("tanggal DESC").
		Limit(limit).
		Find(&records).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get recent weighings: %w", err)
	}

	return records, nil
}

// GetWeighingByID retrieves a weighing record by ID
func (s *WeighingService) GetWeighingByID(id uuid.UUID) (*database.Timbangan, error) {
	var record database.Timbangan

	err := s.db.Where("id_local = ?", id).First(&record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("weighing record not found")
		}
		return nil, fmt.Errorf("failed to get weighing record: %w", err)
	}

	return &record, nil
}

// GetWeighingsByVehicle retrieves weighing records for a specific vehicle
func (s *WeighingService) GetWeighingsByVehicle(nomorKendaraan string, limit int) ([]database.Timbangan, error) {
	var records []database.Timbangan

	err := s.db.Where("nomor_kendaraan = ?", nomorKendaraan).
		Order("tanggal DESC").
		Limit(limit).
		Find(&records).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get weighings for vehicle: %w", err)
	}

	return records, nil
}

// GetWeighingsByDateRange retrieves weighing records within a date range
func (s *WeighingService) GetWeighingsByDateRange(startDate, endDate time.Time, limit int) ([]database.Timbangan, error) {
	var records []database.Timbangan

	err := s.db.Where("tanggal BETWEEN ? AND ?", startDate, endDate).
		Order("tanggal DESC").
		Limit(limit).
		Find(&records).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get weighings by date range: %w", err)
	}

	return records, nil
}

// GetSyncStats returns synchronization statistics
func (s *WeighingService) GetSyncStats() (map[string]int, error) {
	stats := make(map[string]int)

	// Count by sync status
	var results []struct {
		StatusSync string
		Count      int
	}

	err := s.db.Model(&database.Timbangan{}).
		Select("status_sync, COUNT(*) as count").
		Group("status_sync").
		Find(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get sync stats: %w", err)
	}

	for _, result := range results {
		stats[result.StatusSync] = result.Count
	}

	// Total records
	var total int64
	s.db.Model(&database.Timbangan{}).Count(&total)
	stats["total"] = int(total)

	return stats, nil
}

// UpdateSyncStatus updates the sync status of a weighing record
func (s *WeighingService) UpdateSyncStatus(idLocal uuid.UUID, status types.SyncStatus, idPusat *uuid.UUID, errorMsg *string) error {
	updates := map[string]interface{}{
		"status_sync": string(status),
		"updated_at":  time.Now(),
	}

	if status == types.SyncStatusSynced && idPusat != nil {
		updates["id_pusat"] = idPusat
		updates["synced_at"] = time.Now()
		updates["error_message"] = nil
	}

	if status == types.SyncStatusFailed && errorMsg != nil {
		updates["error_message"] = errorMsg
	}

	err := s.db.Model(&database.Timbangan{}).
		Where("id_local = ?", idLocal).
		Updates(updates).Error

	if err != nil {
		return fmt.Errorf("failed to update sync status: %w", err)
	}

	return nil
}

// validateWeighingInput validates weighing input data
func (s *WeighingService) validateWeighingInput(nomorKendaraan string, beratKotor, beratBersih int) error {
	if nomorKendaraan == "" {
		return fmt.Errorf("nomor kendaraan cannot be empty")
	}

	if len(nomorKendaraan) > 50 {
		return fmt.Errorf("nomor kendaraan exceeds maximum length of 50 characters")
	}

	if beratKotor <= 0 {
		return fmt.Errorf("berat kotor must be greater than 0")
	}

	if beratBersih < 0 {
		return fmt.Errorf("berat bersih cannot be negative")
	}

	if beratBersih > beratKotor {
		return fmt.Errorf("berat bersih cannot be greater than berat kotor")
	}

	return nil
}

// DeleteWeighing deletes a weighing record (soft delete or hard delete based on sync status)
func (s *WeighingService) DeleteWeighing(idLocal uuid.UUID) error {
	// Check if record exists and is not synced
	var record database.Timbangan
	err := s.db.Where("id_local = ?", idLocal).First(&record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("weighing record not found")
		}
		return fmt.Errorf("failed to get weighing record: %w", err)
	}

	// Only allow deletion of unsynced records
	if record.StatusSync == string(types.SyncStatusSynced) {
		return fmt.Errorf("cannot delete synced records")
	}

	// Begin transaction
	tx := s.db.Begin()
	if tx.Error != nil {
		return fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete sync queue entry
	if err := tx.Where("entity_id = ?", idLocal).Delete(&database.SyncQueue{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete sync queue entry: %w", err)
	}

	// Delete weighing record
	if err := tx.Where("id_local = ?", idLocal).Delete(&database.Timbangan{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete weighing record: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("Weighing record deleted: ID=%s", idLocal.String())
	return nil
}

// ===== TIMBANGAN-SPECIFIC METHODS =====

// RecordEnhancedWeighing records a new weighing with enhanced TIMBANGAN features
func (s *WeighingService) RecordEnhancedWeighing(nomorKendaraan string, beratKotor, beratBersih int, operatorID uuid.UUID, weighingType, vehicleType, qualityGrade, notes string, supplierID *uuid.UUID, tareWeight int) (*database.Timbangan, error) {
	// Validate input
	if err := s.validateEnhancedWeighingInput(nomorKendaraan, beratKotor, beratBersih, weighingType, operatorID); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Get current active session for operator
	session, err := s.GetOrCreateActiveSession(operatorID)
	if err != nil {
		log.Printf("Warning: Failed to get/create session: %v", err)
	}

	// Begin transaction
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("Transaction rolled back due to panic: %v", r)
		}
	}()

	// Create enhanced weighing record
	now := time.Now()
	idLocal := uuid.New()

	timbangan := &database.Timbangan{
		IDLocal:        idLocal,
		NomorKendaraan: nomorKendaraan,
		BeratKotor:     beratKotor,
		BeratBersih:    beratBersih,
		WeighingType:   weighingType,
		QualityGrade:   qualityGrade,
		SupplierID:     supplierID,
		Notes:          notes,
		OperatorID:     operatorID,
		VehicleType:    vehicleType,
		TareWeight:     tareWeight,
		Tanggal:        now,
		StatusSync:     string(types.SyncStatusPending),
		SyncVersion:    1,
		DeviceID:       s.deviceID.String(),
	}

	// Link to session if available
	if session != nil {
		timbangan.SessionID = &session.ID
	}

	// Insert timbangan record
	if err := tx.Create(timbangan).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create timbangan record: %w", err)
	}

	// Update session statistics if available
	if session != nil {
		if err := s.updateSessionStats(tx, session.ID, beratBersih); err != nil {
			log.Printf("Warning: Failed to update session stats: %v", err)
		}
	}

	// Generate idempotency key with enhanced data
	idempotencyKey := utils.GenerateIdempotencyKey(
		s.deviceID.String(),
		nomorKendaraan,
		beratKotor,
		now,
	)

	// Prepare enhanced payload for sync queue
	timbanganData := types.TimbanganData{
		IDLocal:        idLocal,
		NomorKendaraan: nomorKendaraan,
		BeratKotor:     beratKotor,
		BeratBersih:    beratBersih,
		Tanggal:        now,
		IdempotencyKey: idempotencyKey,
		ClientVersion:  1,
		DeviceID:       s.deviceID.String(),
		WeighingType:   weighingType,
		VehicleType:    vehicleType,
		QualityGrade:   qualityGrade,
		OperatorID:     operatorID,
		TareWeight:     tareWeight,
	}

	payloadJSON, err := json.Marshal(timbanganData)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create sync queue entry
	syncQueue := &database.SyncQueue{
		EntityType:     "timbangan",
		EntityID:       idLocal,
		PayloadJSON:    string(payloadJSON),
		Status:         string(types.QueueStatusPending),
		RetryCount:     0,
		MaxRetries:     s.config.Sync.MaxRetries,
		IdempotencyKey: idempotencyKey,
	}

	if err := tx.Create(syncQueue).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create sync queue entry: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("Enhanced weighing recorded successfully: ID=%s, Vehicle=%s, Gross=%d, Net=%d, Type=%s, Operator=%s",
		idLocal.String(), nomorKendaraan, beratKotor, beratBersih, weighingType, operatorID.String())

	return timbangan, nil
}

// GetVehicleHistory retrieves weighings for a specific vehicle with analytics
func (s *WeighingService) GetVehicleHistory(nomorKendaraan string, limit int) ([]database.Timbangan, error) {
	var records []database.Timbangan

	err := s.db.Where("nomor_kendaraan = ?", nomorKendaraan).
		Order("tanggal DESC").
		Limit(limit).
		Find(&records).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get vehicle history: %w", err)
	}

	return records, nil
}

// GetBatchWeighings retrieves weighings for a specific operator with pagination
func (s *WeighingService) GetBatchWeighings(userID uuid.UUID, limit, offset int) ([]database.Timbangan, error) {
	var records []database.Timbangan

	err := s.db.Where("operator_id = ?", userID).
		Order("tanggal DESC").
		Limit(limit).
		Offset(offset).
		Find(&records).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get batch weighings: %w", err)
	}

	return records, nil
}

// ValidateWeightRules validates weight against configured rules
func (s *WeighingService) ValidateWeightRules(beratKotor, beratBersih int, vehicleType, weighingType string) (bool, string, error) {
	var rules []database.WeightValidationRule

	// Get applicable rules
	query := s.db.Where("is_active = ?", true).
		Where("(vehicle_type = ? OR vehicle_type = '')", vehicleType).
		Where("(weighing_type = ? OR weighing_type = 'ALL')", weighingType)

	if err := query.Find(&rules).Error; err != nil {
		return false, "", fmt.Errorf("failed to get validation rules: %w", err)
	}

	for _, rule := range rules {
		// Check minimum weight
		if rule.MinWeight != nil && beratKotor < *rule.MinWeight {
			return false, rule.WarningMessage, nil
		}

		// Check maximum weight
		if rule.MaxWeight != nil && beratKotor > *rule.MaxWeight {
			return false, rule.WarningMessage, nil
		}

		// Check tolerance (simplified for gross weight)
		if rule.TolerancePercent > 0 && beratBersih > 0 {
			expectedNet := beratKotor // Simplified: assume gross = net + tare
			tolerance := float64(expectedNet) * rule.TolerancePercent / 100
			if float64(beratBersih) < float64(expectedNet)-tolerance || float64(beratBersih) > float64(expectedNet)+tolerance {
				return false, rule.WarningMessage, nil
			}
		}
	}

	return true, "", nil
}

// GetDailyStats retrieves daily statistics for an operator
func (s *WeighingService) GetDailyStats(userID uuid.UUID, date time.Time) (map[string]interface{}, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	stats := make(map[string]interface{})

	// Get total count
	var totalCount int64
	s.db.Model(&database.Timbangan{}).
		Where("operator_id = ? AND tanggal BETWEEN ? AND ?", userID, startOfDay, endOfDay).
		Count(&totalCount)
	stats["totalWeighings"] = totalCount

	// Get total weight
	var totalWeight sql.NullInt64
	s.db.Model(&database.Timbangan{}).
		Where("operator_id = ? AND tanggal BETWEEN ? AND ?", userID, startOfDay, endOfDay).
		Select("COALESCE(SUM(berat_bersih), 0)").
		Scan(&totalWeight)
	stats["totalWeight"] = totalWeight.Int64

	// Get average weight
	var avgWeight sql.NullFloat64
	s.db.Model(&database.Timbangan{}).
		Where("operator_id = ? AND tanggal BETWEEN ? AND ?", userID, startOfDay, endOfDay).
		Select("COALESCE(AVG(berat_bersih), 0)").
		Scan(&avgWeight)
	stats["averageWeight"] = avgWeight.Float64

	// Get weighings by type
	var typeStats []struct {
		WeighingType string
		Count        int64
	}
	s.db.Model(&database.Timbangan{}).
		Where("operator_id = ? AND tanggal BETWEEN ? AND ?", userID, startOfDay, endOfDay).
		Select("weighing_type, COUNT(*) as count").
		Group("weighing_type").
		Scan(&typeStats)

	typeBreakdown := make(map[string]int64)
	for _, stat := range typeStats {
		typeBreakdown[stat.WeighingType] = stat.Count
	}
	stats["weighingsByType"] = typeBreakdown

	return stats, nil
}

// GetActiveWeighingSessions retrieves currently active weighing sessions
func (s *WeighingService) GetActiveWeighingSessions() ([]database.WeighingSession, error) {
	var sessions []database.WeighingSession

	err := s.db.Where("session_end IS NULL").
		Order("session_start DESC").
		Find(&sessions).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get active sessions: %w", err)
	}

	return sessions, nil
}

// GetVehicleTemplates retrieves active vehicle templates
func (s *WeighingService) GetVehicleTemplates() ([]database.VehicleTemplate, error) {
	var templates []database.VehicleTemplate

	err := s.db.Where("is_active = ?", true).
		Order("vehicle_type").
		Find(&templates).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get vehicle templates: %w", err)
	}

	return templates, nil
}

// GetOrCreateActiveSession gets or creates an active session for an operator
func (s *WeighingService) GetOrCreateActiveSession(operatorID uuid.UUID) (*database.WeighingSession, error) {
	var session database.WeighingSession

	// Try to find existing active session
	err := s.db.Where("operator_id = ? AND session_end IS NULL", operatorID).
		Order("session_start DESC").
		First(&session).Error

	if err == nil {
		return &session, nil
	}

	if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to query active session: %w", err)
	}

	// Create new session
	session = database.WeighingSession{
		OperatorID:   operatorID,
		SessionStart: time.Now(),
		DeviceID:     s.deviceID.String(),
	}

	if err := s.db.Create(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to create new session: %w", err)
	}

	log.Printf("Created new session for operator %s: %s", operatorID.String(), session.ID.String())
	return &session, nil
}

// updateSessionStats updates session statistics after a weighing
func (s *WeighingService) updateSessionStats(tx *gorm.DB, sessionID uuid.UUID, weight int) error {
	// Update total weighings and weight
	updates := map[string]interface{}{
		"total_weighings": gorm.Expr("total_weighings + 1"),
		"total_weight":    gorm.Expr("total_weight + ?", weight),
		"updated_at":      time.Now(),
	}

	err := tx.Model(&database.WeighingSession{}).
		Where("id = ?", sessionID).
		Updates(updates).Error

	if err != nil {
		return fmt.Errorf("failed to update session stats: %w", err)
	}

	// Update average weight
	err = tx.Model(&database.WeighingSession{}).
		Where("id = ?", sessionID).
		Update("average_weight", gorm.Expr("CASE WHEN total_weighings > 0 THEN CAST(total_weight AS FLOAT) / total_weighings ELSE 0 END")).Error

	if err != nil {
		return fmt.Errorf("failed to update average weight: %w", err)
	}

	return nil
}

// validateEnhancedWeighingInput validates enhanced weighing input data
func (s *WeighingService) validateEnhancedWeighingInput(nomorKendaraan string, beratKotor, beratBersih int, weighingType string, operatorID uuid.UUID) error {
	// Basic validation
	if err := s.validateWeighingInput(nomorKendaraan, beratKotor, beratBersih); err != nil {
		return err
	}

	// Validate weighing type
	validTypes := []string{"GROSS", "TARE", "NET"}
	isValidType := false
	for _, vt := range validTypes {
		if weighingType == vt {
			isValidType = true
			break
		}
	}
	if !isValidType {
		return fmt.Errorf("invalid weighing type: %s", weighingType)
	}

	// Validate operator ID
	if operatorID == uuid.Nil {
		return fmt.Errorf("operator ID cannot be empty")
	}

	return nil
}
