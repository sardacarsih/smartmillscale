package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
)

var (
	ErrPKSTimbanganNotFound       = errors.New("PKS timbangan not found")
	ErrInvalidTransactionNumber   = errors.New("invalid transaction number")
	ErrTransactionAlreadyTimbang1 = errors.New("transaction already completed timbang 1")
	ErrTransactionAlreadyTimbang2 = errors.New("transaction already completed timbang 2")
	ErrTransactionCompleted       = errors.New("transaction already completed")
	ErrInvalidWeight              = errors.New("invalid weight value")
	ErrMasterDataNotFound         = errors.New("master data not found")
	ErrUnauthorized               = errors.New("unauthorized to perform operation")
)

// PKSService handles PKS (Palm Oil Mill System) business logic
type PKSService struct {
	db          *gorm.DB
	deviceID    string
	currentUser uuid.UUID
}

// NewPKSService creates a new PKS service
func NewPKSService(db *gorm.DB, deviceID string) *PKSService {
	return &PKSService{
		db:       db,
		deviceID: deviceID,
	}
}

// SetCurrentUser sets the current user for the service operations
func (s *PKSService) SetCurrentUser(userID uuid.UUID) {
	s.currentUser = userID
}

// CreateTimbang1 creates a new PKS transaction (Timbang 1 - First weighing)
func (s *PKSService) CreateTimbang1(ctx context.Context, req *CreateTimbang1Request) (*database.TimbanganPKS, error) {
	// Validate request
	if err := s.validateCreateTimbang1Request(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Validate master data
	if err := s.validateMasterData(ctx, req); err != nil {
		return nil, err
	}

	// Create PKS transaction record
	pksTimbangan := &database.TimbanganPKS{
		NoTransaksi:  req.NoTransaksi,
		IDProduk:     req.IDProduk,
		IDUnit:       req.IDUnit,
		IDSupplier:   req.IDSupplier,
		DriverName:   req.DriverName,
		Bruto:        req.Bruto,
		Tara:         req.Tara,
		Netto:        req.Netto,
		Status:       "timbang1",
		Timbang1Date: time.Now(),
		Officer1ID:   s.currentUser,
	}

	// Set TBS-specific fields if provided
	if req.IDEstate != nil {
		pksTimbangan.IDEstate = req.IDEstate
	}
	if req.IDAfdeling != nil {
		pksTimbangan.IDAfdeling = req.IDAfdeling
	}
	if req.IDBlok != nil {
		pksTimbangan.IDBlok = req.IDBlok
	}
	pksTimbangan.SumberTBS = req.SumberTBS
	pksTimbangan.Janjang = req.Janjang
	pksTimbangan.Grade = req.Grade

	// Save to database
	if err := s.db.WithContext(ctx).Create(pksTimbangan).Error; err != nil {
		return nil, fmt.Errorf("failed to create PKS timbangan: %w", err)
	}

	return pksTimbangan, nil
}

// UpdateTimbang2 updates an existing PKS transaction (Timbang 2 - Second weighing)
func (s *PKSService) UpdateTimbang2(ctx context.Context, req *UpdateTimbang2Request) (*database.TimbanganPKS, error) {
	// Validate request
	if err := s.validateUpdateTimbang2Request(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Get existing PKS timbangan
	var pksTimbangan database.TimbanganPKS
	if err := s.db.WithContext(ctx).Where("no_transaksi = ?", req.NoTransaksi).First(&pksTimbangan).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPKSTimbanganNotFound
		}
		return nil, fmt.Errorf("failed to get PKS timbangan: %w", err)
	}

	// Validate status progression
	if pksTimbangan.Status == "timbang1" {
		// Valid progression
	} else if pksTimbangan.Status == "timbang2" {
		return nil, ErrTransactionAlreadyTimbang2
	} else if pksTimbangan.Status == "selesai" {
		return nil, ErrTransactionCompleted
	} else {
		return nil, fmt.Errorf("invalid transaction status: %s", pksTimbangan.Status)
	}

	// Update weighing data
	pksTimbangan.Bruto2 = req.Bruto2
	pksTimbangan.Tara2 = req.Tara2
	pksTimbangan.Netto2 = req.Netto2
	pksTimbangan.Status = "timbang2"
	now := time.Now()
	pksTimbangan.Timbang2Date = &now
	pksTimbangan.Officer2ID = &s.currentUser

	// Save changes
	if err := s.db.WithContext(ctx).Save(&pksTimbangan).Error; err != nil {
		return nil, fmt.Errorf("failed to update PKS timbangan: %w", err)
	}

	return &pksTimbangan, nil
}

// CompleteTransaction completes a PKS transaction after Timbang 2
func (s *PKSService) CompleteTransaction(ctx context.Context, noTransaksi string) (*database.TimbanganPKS, error) {
	// Get existing PKS timbangan
	var pksTimbangan database.TimbanganPKS
	if err := s.db.WithContext(ctx).Where("no_transaksi = ?", noTransaksi).First(&pksTimbangan).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPKSTimbanganNotFound
		}
		return nil, fmt.Errorf("failed to get PKS timbangan: %w", err)
	}

	// Validate status
	if pksTimbangan.Status != "timbang2" {
		return nil, fmt.Errorf("transaction must be in timbang2 status to complete, current status: %s", pksTimbangan.Status)
	}

	// Complete transaction
	pksTimbangan.Status = "selesai"
	now := time.Now()
	pksTimbangan.CompletedDate = &now

	// Save changes
	if err := s.db.WithContext(ctx).Save(&pksTimbangan).Error; err != nil {
		return nil, fmt.Errorf("failed to complete PKS transaction: %w", err)
	}

	return &pksTimbangan, nil
}

// GetPendingTimbang1 retrieves transactions waiting for Timbang 2
func (s *PKSService) GetPendingTimbang2(ctx context.Context, limit int) ([]database.TimbanganPKS, error) {
	var transactions []database.TimbanganPKS

	query := s.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Estate").
		Preload("Afdeling").
		Preload("Blok").
		Where("status = ?", "timbang1").
		Order("timbang1_date DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&transactions).Error; err != nil {
		return nil, fmt.Errorf("failed to get pending timbang2 transactions: %w", err)
	}

	return transactions, nil
}

// GetPendingTimbang2 retrieves transactions waiting for completion
func (s *PKSService) GetPendingCompletion(ctx context.Context, limit int) ([]database.TimbanganPKS, error) {
	var transactions []database.TimbanganPKS

	query := s.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Estate").
		Preload("Afdeling").
		Preload("Blok").
		Where("status = ?", "timbang2").
		Order("timbang2_date DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&transactions).Error; err != nil {
		return nil, fmt.Errorf("failed to get pending completion transactions: %w", err)
	}

	return transactions, nil
}

// GetPKSTimbanganByNoTransaksi retrieves a PKS transaction by transaction number
func (s *PKSService) GetPKSTimbanganByNoTransaksi(ctx context.Context, noTransaksi string) (*database.TimbanganPKS, error) {
	var pksTimbangan database.TimbanganPKS

	if err := s.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Estate").
		Preload("Afdeling").
		Preload("Blok").
		Preload("Officer1").
		Preload("Officer2").
		Where("no_transaksi = ?", noTransaksi).
		First(&pksTimbangan).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPKSTimbanganNotFound
		}
		return nil, fmt.Errorf("failed to get PKS timbangan: %w", err)
	}

	return &pksTimbangan, nil
}

// SearchPKSTimbangans searches PKS transactions based on criteria
func (s *PKSService) SearchPKSTimbangans(ctx context.Context, req *SearchPKSRequest) (*SearchPKSResponse, error) {
	var transactions []database.TimbanganPKS
	var total int64

	query := s.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Estate").
		Preload("Afdeling").
		Preload("Blok").
		Model(&database.TimbanganPKS{})

	// Apply filters
	if req.NoTransaksi != "" {
		query = query.Where("no_transaksi LIKE ?", "%"+req.NoTransaksi+"%")
	}
	if req.IDProduk > 0 {
		query = query.Where("id_produk = ?", req.IDProduk)
	}
	if req.IDUnit > 0 {
		query = query.Where("id_unit = ?", req.IDUnit)
	}
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if !req.StartDate.IsZero() {
		query = query.Where("timbang1_date >= ?", req.StartDate)
	}
	if !req.EndDate.IsZero() {
		query = query.Where("timbang1_date <= ?", req.EndDate)
	}
	if req.DriverName != "" {
		query = query.Where("driver_name LIKE ?", "%"+req.DriverName+"%")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count PKS transactions: %w", err)
	}

	// Apply pagination
	if req.Limit > 0 {
		query = query.Limit(req.Limit)
	}
	if req.Offset > 0 {
		query = query.Offset(req.Offset)
	}

	// Order by date descending
	query = query.Order("timbang1_date DESC")

	// Execute query
	if err := query.Find(&transactions).Error; err != nil {
		return nil, fmt.Errorf("failed to search PKS transactions: %w", err)
	}

	return &SearchPKSResponse{
		Data:  transactions,
		Total: total,
		Limit: req.Limit,
		Page:  (req.Offset / req.Limit) + 1,
	}, nil
}

// GetPKSStatistics retrieves PKS transaction statistics
func (s *PKSService) GetPKSStatistics(ctx context.Context, dateRange time.Duration) (*PKSStatisticsResponse, error) {
	now := time.Now()
	startDate := now.Add(-dateRange)

	var stats PKSStatisticsResponse

	// Get counts by status
	s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).
		Where("timbang1_date >= ?", startDate).
		Count(&stats.TotalTransactions)

	s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).
		Where("status = ? AND timbang1_date >= ?", "timbang1", startDate).
		Count(&stats.Timbang1Count)

	s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).
		Where("status = ? AND timbang1_date >= ?", "timbang2", startDate).
		Count(&stats.Timbang2Count)

	s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).
		Where("status = ? AND timbang1_date >= ?", "selesai", startDate).
		Count(&stats.CompletedCount)

	// Get total weight
	s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).
		Where("status = ? AND timbang1_date >= ?", "selesai", startDate).
		Select("COALESCE(SUM(netto2), SUM(netto), 0)").
		Scan(&stats.TotalWeight)

	// Get today's statistics
	today := now.Truncate(24 * time.Hour)
	s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).
		Where("timbang1_date >= ?", today).
		Count(&stats.TodayTransactions)

	return &stats, nil
}

// Private helper methods

func (s *PKSService) validateCreateTimbang1Request(req *CreateTimbang1Request) error {
	if req.NoTransaksi == "" {
		return errors.New("transaction number is required")
	}
	if req.IDProduk == 0 {
		return errors.New("product ID is required")
	}
	if req.IDUnit == 0 {
		return errors.New("unit ID is required")
	}
	if req.DriverName == "" {
		return errors.New("driver name is required")
	}
	if req.Bruto < 0 {
		return ErrInvalidWeight
	}
	if req.Tara < 0 {
		return ErrInvalidWeight
	}
	if req.Netto < 0 {
		return ErrInvalidWeight
	}
	return nil
}

func (s *PKSService) validateUpdateTimbang2Request(req *UpdateTimbang2Request) error {
	if req.NoTransaksi == "" {
		return errors.New("transaction number is required")
	}
	if req.Bruto2 < 0 {
		return ErrInvalidWeight
	}
	if req.Tara2 < 0 {
		return ErrInvalidWeight
	}
	if req.Netto2 < 0 {
		return ErrInvalidWeight
	}
	return nil
}

func (s *PKSService) validateMasterData(ctx context.Context, req *CreateTimbang1Request) error {
	// 1. Validate product and get category
	var produk database.MasterProduk
	if err := s.db.WithContext(ctx).
		Where("id = ? AND is_active = ?", req.IDProduk, true).
		First(&produk).Error; err != nil {
		return fmt.Errorf("product not found or inactive")
	}

	// 2. Category-based validation
	isTBS := produk.Kategori == "TBS"

	if isTBS {
		// === TBS Product Validation ===

		// Require Estate
		if req.IDEstate == nil || *req.IDEstate == 0 {
			return fmt.Errorf("estate wajib diisi untuk produk TBS")
		}

		// Require Afdeling (acts as supplier)
		if req.IDAfdeling == nil || *req.IDAfdeling == 0 {
			return fmt.Errorf("afdeling wajib diisi untuk produk TBS")
		}

		// Forbid Customer
		if req.IDSupplier != nil && *req.IDSupplier != 0 {
			return fmt.Errorf("customer tidak boleh diisi untuk produk TBS")
		}

		// Validate Estate exists
		var estate database.MasterEstate
		if err := s.db.WithContext(ctx).
			Where("id = ? AND is_active = ?", *req.IDEstate, true).
			First(&estate).Error; err != nil {
			return fmt.Errorf("estate tidak ditemukan atau tidak aktif")
		}

		// Validate Afdeling exists and belongs to Estate
		var afdeling database.MasterAfdeling
		if err := s.db.WithContext(ctx).
			Where("id = ? AND id_estate = ? AND is_active = ?",
				*req.IDAfdeling, *req.IDEstate, true).
			First(&afdeling).Error; err != nil {
			return fmt.Errorf("afdeling tidak valid atau tidak termasuk estate yang dipilih")
		}

		// Validate Blok if provided (optional)
		if req.IDBlok != nil && *req.IDBlok != 0 {
			var blok database.MasterBlok
			if err := s.db.WithContext(ctx).
				Where("id = ? AND id_afdeling = ? AND is_active = ?",
					*req.IDBlok, *req.IDAfdeling, true).
				First(&blok).Error; err != nil {
				return fmt.Errorf("blok tidak valid atau tidak termasuk afdeling yang dipilih")
			}
		}

	} else {
		// === Non-TBS Product Validation ===

		// Require Customer
		if req.IDSupplier == nil || *req.IDSupplier == 0 {
			return fmt.Errorf("customer wajib diisi untuk produk non-TBS")
		}

		// Forbid TBS fields
		if req.IDAfdeling != nil && *req.IDAfdeling != 0 {
			return fmt.Errorf("afdeling tidak boleh diisi untuk produk non-TBS")
		}
		if req.IDEstate != nil && *req.IDEstate != 0 {
			return fmt.Errorf("estate tidak boleh diisi untuk produk non-TBS")
		}
		if req.IDBlok != nil && *req.IDBlok != 0 {
			return fmt.Errorf("blok tidak boleh diisi untuk produk non-TBS")
		}

		// Validate Customer exists
		var supplier database.MasterSupplier
		if err := s.db.WithContext(ctx).
			Where("id = ? AND is_active = ?", *req.IDSupplier, true).
			First(&supplier).Error; err != nil {
			return fmt.Errorf("customer tidak ditemukan atau tidak aktif")
		}
	}

	// 3. Validate unit (common for both)
	var unit database.MasterUnit
	if err := s.db.WithContext(ctx).
		Where("id = ? AND is_active = ?", req.IDUnit, true).
		First(&unit).Error; err != nil {
		return fmt.Errorf("unit tidak ditemukan atau tidak aktif")
	}

	return nil
}

// Request/Response DTOs

type CreateTimbang1Request struct {
	NoTransaksi string  `json:"noTransaksi"`
	IDProduk    uint    `json:"idProduk"`
	IDUnit      uint    `json:"idUnit"`
	IDSupplier  *uint   `json:"idSupplier"` // Nullable: required for non-TBS (Customer), null for TBS products
	DriverName  string  `json:"driverName"`
	IDEstate    *uint   `json:"idEstate"`
	IDAfdeling  *uint   `json:"idAfdeling"`  // Acts as supplier source for TBS products
	IDBlok      *uint   `json:"idBlok"`
	SumberTBS   string  `json:"sumberTbs"`
	Janjang     string  `json:"janjang"`
	Grade       string  `json:"grade"`
	Bruto       float64 `json:"bruto"`
	Tara        float64 `json:"tara"`
	Netto       float64 `json:"netto"`
}

type UpdateTimbang2Request struct {
	NoTransaksi string  `json:"noTransaksi"`
	Bruto2      float64 `json:"bruto2"`
	Tara2       float64 `json:"tara2"`
	Netto2      float64 `json:"netto2"`
}

type SearchPKSRequest struct {
	NoTransaksi string    `json:"noTransaksi"`
	IDProduk    uint      `json:"idProduk"`
	IDUnit      uint      `json:"idUnit"`
	Status      string    `json:"status"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
	DriverName  string    `json:"driverName"`
	Limit       int       `json:"limit"`
	Offset      int       `json:"offset"`
}

type SearchPKSResponse struct {
	Data  []database.TimbanganPKS `json:"data"`
	Total int64                   `json:"total"`
	Limit int                     `json:"limit"`
	Page  int                     `json:"page"`
}

type PKSStatisticsResponse struct {
	TotalTransactions int64   `json:"totalTransactions"`
	Timbang1Count     int64   `json:"timbang1Count"`
	Timbang2Count     int64   `json:"timbang2Count"`
	CompletedCount    int64   `json:"completedCount"`
	TotalWeight       float64 `json:"totalWeight"`
	TodayTransactions int64   `json:"todayTransactions"`
}
