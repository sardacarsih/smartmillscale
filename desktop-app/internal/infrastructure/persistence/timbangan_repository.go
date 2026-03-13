package persistence

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/mappers"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/models"
)

// TimbanganRepositoryImpl implements the TimbanganRepository interface
type TimbanganRepositoryImpl struct {
	BaseRepository
	mapper *mappers.TimbanganMapper
}

// NewTimbanganRepository creates a new TimbanganRepository implementation
func NewTimbanganRepository(db *gorm.DB) repositories.TimbanganRepository {
	return &TimbanganRepositoryImpl{
		BaseRepository: BaseRepository{db: db},
		mapper:        mappers.NewTimbanganMapper(),
	}
}

// Create creates a new timbangan record
func (r *TimbanganRepositoryImpl) Create(ctx context.Context, timbangan *entities.Timbangan) error {
	if timbangan == nil {
		return errors.New("timbangan cannot be nil")
	}

	model := r.mapper.ToModel(timbangan)
	return r.WithContext(ctx).Create(model).Error
}

// GetByID retrieves a timbangan by ID
func (r *TimbanganRepositoryImpl) GetByID(ctx context.Context, id uuid.UUID) (*entities.Timbangan, error) {
	var model models.TimbanganModel
	err := r.WithContext(ctx).Where("id_local = ?", id).First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("timbangan not found")
		}
		return nil, err
	}
	return r.mapper.ToEntity(&model), nil
}

// Update updates a timbangan record
func (r *TimbanganRepositoryImpl) Update(ctx context.Context, timbangan *entities.Timbangan) error {
	if timbangan == nil {
		return errors.New("timbangan cannot be nil")
	}

	model := r.mapper.ToModel(timbangan)
	return r.WithContext(ctx).Save(model).Error
}

// Delete deletes a timbangan record
func (r *TimbanganRepositoryImpl) Delete(ctx context.Context, id uuid.UUID) error {
	return r.WithContext(ctx).Where("id_local = ?", id).Delete(&models.TimbanganModel{}).Error
}

// GetByNomorKendaraanAndTanggal retrieves a timbangan by vehicle number and date
func (r *TimbanganRepositoryImpl) GetByNomorKendaraanAndTanggal(ctx context.Context, nomorKendaraan string, tanggal time.Time) (*entities.Timbangan, error) {
	var model models.TimbanganModel
	err := r.WithContext(ctx).
		Where("nomor_kendaraan = ? AND DATE(tanggal) = DATE(?)", nomorKendaraan, tanggal).
		First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("timbangan not found")
		}
		return nil, err
	}
	return r.mapper.ToEntity(&model), nil
}

// GetPendingWeighings retrieves pending weighings
func (r *TimbanganRepositoryImpl) GetPendingWeighings(ctx context.Context, limit int) ([]*entities.Timbangan, error) {
	var modelSlice []models.TimbanganModel
	query := r.WithContext(ctx).
		Where("status_sync = ?", "PENDING").
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&modelSlice).Error
	if err != nil {
		return nil, err
	}

	// Convert to pointer slice for mapper
	models := ConvertToPointerSlice(modelSlice)

	return r.mapper.ToEntities(models), nil
}

// GetByDateRange retrieves timbangans within a date range
func (r *TimbanganRepositoryImpl) GetByDateRange(ctx context.Context, startDate, endDate time.Time, limit int) ([]*entities.Timbangan, error) {
	var modelSlice []models.TimbanganModel
	query := r.WithContext(ctx).
		Where("tanggal BETWEEN ? AND ?", startDate, endDate).
		Order("tanggal DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&modelSlice).Error
	if err != nil {
		return nil, err
	}

	models := ConvertToPointerSlice(modelSlice); return r.mapper.ToEntities(models), nil
}

// GetByOperator retrieves timbangans by operator
func (r *TimbanganRepositoryImpl) GetByOperator(ctx context.Context, operatorID uuid.UUID, limit int) ([]*entities.Timbangan, error) {
	var modelSlice []models.TimbanganModel
	query := r.WithContext(ctx).
		Where("operator_id = ?", operatorID).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&modelSlice).Error
	if err != nil {
		return nil, err
	}

	models := ConvertToPointerSlice(modelSlice); return r.mapper.ToEntities(models), nil
}

// GetRecentWeighings retrieves recent timbangans
func (r *TimbanganRepositoryImpl) GetRecentWeighings(ctx context.Context, limit int) ([]*entities.Timbangan, error) {
	var modelSlice []models.TimbanganModel
	query := r.WithContext(ctx).Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&modelSlice).Error
	if err != nil {
		return nil, err
	}

	models := ConvertToPointerSlice(modelSlice); return r.mapper.ToEntities(models), nil
}

// GetPendingSync retrieves timbangans pending synchronization
func (r *TimbanganRepositoryImpl) GetPendingSync(ctx context.Context, limit int) ([]*entities.Timbangan, error) {
	return r.GetPendingWeighings(ctx, limit)
}

// GetFailedSync retrieves timbangans with failed sync
func (r *TimbanganRepositoryImpl) GetFailedSync(ctx context.Context, limit int) ([]*entities.Timbangan, error) {
	var modelSlice []models.TimbanganModel
	query := r.WithContext(ctx).
		Where("status_sync = ?", "FAILED").
		Order("updated_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&modelSlice).Error
	if err != nil {
		return nil, err
	}

	models := ConvertToPointerSlice(modelSlice); return r.mapper.ToEntities(models), nil
}

// MarkAsSynced marks a timbangan as synced
func (r *TimbanganRepositoryImpl) MarkAsSynced(ctx context.Context, id uuid.UUID, serverID uuid.UUID) error {
	now := time.Now()
	updates := map[string]interface{}{
		"id_pusat":    serverID,
		"status_sync": "SYNCED",
		"synced_at":   &now,
		"error_message": nil,
		"updated_at":  now,
	}
	return r.WithContext(ctx).Model(&models.TimbanganModel{}).Where("id_local = ?", id).Updates(updates).Error
}

// MarkAsSyncFailed marks a timbangan as sync failed
func (r *TimbanganRepositoryImpl) MarkAsSyncFailed(ctx context.Context, id uuid.UUID, err error) error {
	var errorMsg *string
	if err != nil {
		msg := err.Error()
		errorMsg = &msg
	}

	updates := map[string]interface{}{
		"status_sync":   "FAILED",
		"error_message": errorMsg,
		"updated_at":    time.Now(),
	}
	return r.WithContext(ctx).Model(&models.TimbanganModel{}).Where("id_local = ?", id).Updates(updates).Error
}

// Search searches timbangans by query
func (r *TimbanganRepositoryImpl) Search(ctx context.Context, query string, limit int) ([]*entities.Timbangan, error) {
	var modelSlice []models.TimbanganModel
	searchQuery := r.WithContext(ctx).
		Where("nomor_kendaraan LIKE ? OR notes LIKE ?", "%"+query+"%", "%"+query+"%").
		Order("created_at DESC")

	if limit > 0 {
		searchQuery = searchQuery.Limit(limit)
	}

	err := searchQuery.Find(&modelSlice).Error
	if err != nil {
		return nil, err
	}

	models := ConvertToPointerSlice(modelSlice); return r.mapper.ToEntities(models), nil
}

// GetByVehicleType retrieves timbangans by vehicle type
func (r *TimbanganRepositoryImpl) GetByVehicleType(ctx context.Context, vehicleType string, limit int) ([]*entities.Timbangan, error) {
	var modelSlice []models.TimbanganModel
	query := r.WithContext(ctx).
		Where("vehicle_type = ?", vehicleType).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&modelSlice).Error
	if err != nil {
		return nil, err
	}

	models := ConvertToPointerSlice(modelSlice); return r.mapper.ToEntities(models), nil
}

// GetByWeighingType retrieves timbangans by weighing type
func (r *TimbanganRepositoryImpl) GetByWeighingType(ctx context.Context, weighingType entities.WeighingType, limit int) ([]*entities.Timbangan, error) {
	var modelSlice []models.TimbanganModel
	query := r.WithContext(ctx).
		Where("weighing_type = ?", string(weighingType)).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&modelSlice).Error
	if err != nil {
		return nil, err
	}

	models := ConvertToPointerSlice(modelSlice); return r.mapper.ToEntities(models), nil
}

// CountByDate counts timbangans by date
func (r *TimbanganRepositoryImpl) CountByDate(ctx context.Context, date time.Time) (int, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.TimbanganModel{}).
		Where("DATE(tanggal) = DATE(?)", date).
		Count(&count).Error
	return int(count), err
}

// CountByDateRange counts timbangans in date range
func (r *TimbanganRepositoryImpl) CountByDateRange(ctx context.Context, startDate, endDate time.Time) (int, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.TimbanganModel{}).
		Where("tanggal BETWEEN ? AND ?", startDate, endDate).
		Count(&count).Error
	return int(count), err
}

// CountPendingSync counts pending sync timbangans
func (r *TimbanganRepositoryImpl) CountPendingSync(ctx context.Context) (int, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.TimbanganModel{}).
		Where("status_sync = ?", "PENDING").
		Count(&count).Error
	return int(count), err
}

// GetTotalWeightByDate gets total weight by date
func (r *TimbanganRepositoryImpl) GetTotalWeightByDate(ctx context.Context, date time.Time) (int, error) {
	var totalWeight sql.NullInt64
	err := r.WithContext(ctx).
		Model(&models.TimbanganModel{}).
		Select("COALESCE(SUM(berat_bersih), 0)").
		Where("DATE(tanggal) = DATE(?)", date).
		Scan(&totalWeight).Error
	return int(totalWeight.Int64), err
}

// CreateBatch creates multiple timbangans in a transaction
func (r *TimbanganRepositoryImpl) CreateBatch(ctx context.Context, timbangans []*entities.Timbangan) error {
	if len(timbangans) == 0 {
		return nil
	}

	return r.Transaction(ctx, func(tx *gorm.DB) error {
		models := r.mapper.ToModels(timbangans)
		if len(models) == 0 {
			return nil
		}
		return tx.CreateInBatches(models, 100).Error
	})
}

// UpdateBatch updates multiple timbangans in a transaction
func (r *TimbanganRepositoryImpl) UpdateBatch(ctx context.Context, timbangans []*entities.Timbangan) error {
	if len(timbangans) == 0 {
		return nil
	}

	return r.Transaction(ctx, func(tx *gorm.DB) error {
		for _, timbangan := range timbangans {
			model := r.mapper.ToModel(timbangan)
			if err := tx.Save(model).Error; err != nil {
				return err
			}
		}
		return nil
	})
}