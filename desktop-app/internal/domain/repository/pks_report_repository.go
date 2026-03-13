package repository

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"gorm.io/gorm"
)

// PKSReportRepository handles database queries for PKS reporting
type PKSReportRepository struct {
	db *gorm.DB
}

// NewPKSReportRepository creates a new instance of PKS Report Repository
func NewPKSReportRepository(db *gorm.DB) *PKSReportRepository {
	return &PKSReportRepository{db: db}
}

// DateRange represents a time period for querying
type DateRange struct {
	Start time.Time
	End   time.Time
}

// ============================================================================
// MAIN QUERY METHODS
// ============================================================================

// GetTransactionsWithDetails retrieves all transactions with full relationship data
func (r *PKSReportRepository) GetTransactionsWithDetails(ctx context.Context, dateRange DateRange, filters ReportFilters) ([]database.TimbanganPKS, error) {
	var transactions []database.TimbanganPKS

	query := r.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Supplier").
		Preload("Estate").
		Preload("Afdeling").
		Preload("Blok").
		Preload("Officer1").
		Preload("Officer2").
		Where("timbang1_date >= ? AND timbang1_date <= ?", dateRange.Start, dateRange.End)

	// Apply filters
	if len(filters.SupplierIDs) > 0 {
		query = query.Where("id_supplier IN ?", filters.SupplierIDs)
	}

	if len(filters.ProductIDs) > 0 {
		query = query.Where("id_produk IN ?", filters.ProductIDs)
	}

	if filters.StatusFilter != "all" && filters.StatusFilter != "" {
		if filters.StatusFilter == "completed" {
			query = query.Where("status = ?", "selesai")
		} else if filters.StatusFilter == "rejected" {
			query = query.Where("status != ?", "selesai")
		}
	}

	if len(filters.GradeFilter) > 0 {
		query = query.Where("grade IN ?", filters.GradeFilter)
	}

	// Order by transaction date
	query = query.Order("timbang1_date ASC")

	if err := query.Find(&transactions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch transactions: %w", err)
	}

	return transactions, nil
}

// ReportFilters contains query filter parameters
type ReportFilters struct {
	SupplierIDs  []uint
	ProductIDs   []uint
	StatusFilter string
	GradeFilter  []string
}

// ============================================================================
// TBS CLASSIFICATION
// ============================================================================

// TBSClassificationData represents aggregated data by supplier type
type TBSClassificationData struct {
	SupplierType string
	Count        int
	TotalWeight  float64
}

// GetTBSClassificationSummary aggregates data by JenisSupplier
func (r *PKSReportRepository) GetTBSClassificationSummary(ctx context.Context, dateRange DateRange) ([]TBSClassificationData, error) {
	var results []TBSClassificationData

	// Query with JOIN to get JenisSupplier
	err := r.db.WithContext(ctx).
		Table("timbangan_pks tp").
		Select(`
			COALESCE(ms.jenis_supplier, 'TIDAK DIKETAHUI') as supplier_type,
			COUNT(*) as count,
			SUM(CASE WHEN tp.netto2 > 0 THEN tp.netto2 ELSE tp.netto END) as total_weight
		`).
		Joins("LEFT JOIN master_supplier ms ON tp.id_supplier = ms.id").
		Where("tp.timbang1_date >= ? AND tp.timbang1_date <= ?", dateRange.Start, dateRange.End).
		Group("ms.jenis_supplier").
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get TBS classification summary: %w", err)
	}

	return results, nil
}

// ============================================================================
// REJECTION SUMMARY
// ============================================================================

// RejectionData represents rejection statistics
type RejectionData struct {
	Count       int
	TotalWeight float64
	Reasons     map[string]int
}

// GetRejectionsSummary calculates rejection metrics
func (r *PKSReportRepository) GetRejectionsSummary(ctx context.Context, dateRange DateRange) (*RejectionData, error) {
	var transactions []database.TimbanganPKS

	// Query for rejected transactions (status != 'selesai' OR grade IN ('C', 'D'))
	err := r.db.WithContext(ctx).
		Where("timbang1_date >= ? AND timbang1_date <= ?", dateRange.Start, dateRange.End).
		Where("status != ? OR grade IN ?", "selesai", []string{"C", "D"}).
		Find(&transactions).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get rejections summary: %w", err)
	}

	// Calculate metrics
	data := &RejectionData{
		Count:       len(transactions),
		TotalWeight: 0,
		Reasons:     make(map[string]int),
	}

	for _, tx := range transactions {
		// Calculate weight
		weight := tx.Netto
		if tx.Netto2 > 0 {
			weight = tx.Netto2
		}
		data.TotalWeight += weight

		// Categorize reason
		if tx.Status != "selesai" {
			reason := fmt.Sprintf("Status: %s", tx.Status)
			data.Reasons[reason]++
		}

		if tx.Grade == "C" || tx.Grade == "D" {
			reason := fmt.Sprintf("Grade: %s", tx.Grade)
			data.Reasons[reason]++
		}
	}

	return data, nil
}

// ============================================================================
// HOURLY DISTRIBUTION
// ============================================================================

// HourlyDistData represents transaction count per hour
type HourlyDistData struct {
	Hour  int
	Count int
}

// GetHourlyDistribution returns transaction count per hour for a given date
func (r *PKSReportRepository) GetHourlyDistribution(ctx context.Context, date time.Time) ([]HourlyDistData, error) {
	var results []HourlyDistData

	// Extract hour and count transactions
	err := r.db.WithContext(ctx).
		Table("timbangan_pks").
		Select(`
			CAST(strftime('%H', timbang1_date) AS INTEGER) as hour,
			COUNT(*) as count
		`).
		Where("DATE(timbang1_date) = ?", date.Format("2006-01-02")).
		Group("CAST(strftime('%H', timbang1_date) AS INTEGER)").
		Order("hour ASC").
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get hourly distribution: %w", err)
	}

	// Fill in missing hours with zero count
	hourMap := make(map[int]int)
	for _, r := range results {
		hourMap[r.Hour] = r.Count
	}

	fullResults := make([]HourlyDistData, 24)
	for i := 0; i < 24; i++ {
		fullResults[i] = HourlyDistData{
			Hour:  i,
			Count: hourMap[i],
		}
	}

	return fullResults, nil
}

// ============================================================================
// DAILY TRENDS
// ============================================================================

// DailyTrendData represents aggregated data per day
type DailyTrendData struct {
	Date        string
	TotalWeight float64
	TransCount  int
}

// GetDailyTrends returns aggregated data for each day in the date range
func (r *PKSReportRepository) GetDailyTrends(ctx context.Context, dateRange DateRange) ([]DailyTrendData, error) {
	var results []DailyTrendData

	err := r.db.WithContext(ctx).
		Table("timbangan_pks").
		Select(`
			DATE(timbang1_date) as date,
			SUM(CASE WHEN netto2 > 0 THEN netto2 ELSE netto END) as total_weight,
			COUNT(*) as trans_count
		`).
		Where("timbang1_date >= ? AND timbang1_date <= ?", dateRange.Start, dateRange.End).
		Group("DATE(timbang1_date)").
		Order("date ASC").
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get daily trends: %w", err)
	}

	return results, nil
}

// ============================================================================
// GRADE DISTRIBUTION
// ============================================================================

// GradeDistData represents distribution by grade
type GradeDistData struct {
	Grade  string
	Count  int
	Weight float64
}

// GetGradeDistribution returns transaction count and weight per grade
func (r *PKSReportRepository) GetGradeDistribution(ctx context.Context, dateRange DateRange) ([]GradeDistData, error) {
	var results []GradeDistData

	err := r.db.WithContext(ctx).
		Table("timbangan_pks").
		Select(`
			COALESCE(grade, 'Tidak Ada') as grade,
			COUNT(*) as count,
			SUM(CASE WHEN netto2 > 0 THEN netto2 ELSE netto END) as weight
		`).
		Where("timbang1_date >= ? AND timbang1_date <= ?", dateRange.Start, dateRange.End).
		Group("grade").
		Order("count DESC").
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get grade distribution: %w", err)
	}

	return results, nil
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

// DetectWeightOutliers identifies transactions with unusual weights
func (r *PKSReportRepository) DetectWeightOutliers(ctx context.Context, dateRange DateRange, threshold float64) ([]database.TimbanganPKS, []float64, error) {
	// Get all completed transactions
	var transactions []database.TimbanganPKS

	err := r.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Supplier").
		Preload("Officer1").
		Preload("Officer2").
		Where("timbang1_date >= ? AND timbang1_date <= ?", dateRange.Start, dateRange.End).
		Where("status = ?", "selesai").
		Find(&transactions).Error

	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch transactions for outlier detection: %w", err)
	}

	if len(transactions) < 3 {
		// Not enough data for statistical analysis
		return []database.TimbanganPKS{}, []float64{}, nil
	}

	// Calculate mean and standard deviation
	var sum, sumSquared float64
	weights := make([]float64, len(transactions))

	for i, tx := range transactions {
		weight := tx.Netto
		if tx.Netto2 > 0 {
			weight = tx.Netto2
		}
		weights[i] = weight
		sum += weight
		sumSquared += weight * weight
	}

	count := float64(len(transactions))
	mean := sum / count
	variance := (sumSquared / count) - (mean * mean)
	stdDev := math.Sqrt(variance)

	// Find outliers (z-score > threshold)
	var outliers []database.TimbanganPKS
	var zScores []float64

	for i, tx := range transactions {
		weight := weights[i]
		zScore := (weight - mean) / stdDev

		if math.Abs(zScore) > threshold {
			outliers = append(outliers, tx)
			zScores = append(zScores, zScore)
		}
	}

	return outliers, zScores, nil
}

// FindDuplicateVehicles identifies vehicles with multiple transactions in the same day
func (r *PKSReportRepository) FindDuplicateVehicles(ctx context.Context, dateRange DateRange) ([]DuplicateVehicleData, error) {
	var results []DuplicateVehicleData

	// For single day reports, group by date and vehicle
	err := r.db.WithContext(ctx).
		Table("timbangan_pks tp").
		Select(`
			DATE(tp.timbang1_date) as date,
			mu.nomor_polisi as vehicle_number,
			COUNT(*) as count,
			GROUP_CONCAT(tp.no_transaksi) as transaction_ids
		`).
		Joins("JOIN master_unit mu ON tp.id_unit = mu.id").
		Where("tp.timbang1_date >= ? AND tp.timbang1_date <= ?", dateRange.Start, dateRange.End).
		Group("DATE(tp.timbang1_date), mu.nomor_polisi").
		Having("COUNT(*) > 1").
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to find duplicate vehicles: %w", err)
	}

	return results, nil
}

// DuplicateVehicleData represents a vehicle with duplicate entries
type DuplicateVehicleData struct {
	Date           string
	VehicleNumber  string
	Count          int
	TransactionIDs string // Comma-separated IDs
}

// GetIncompleteTransactions returns transactions stuck in progress
func (r *PKSReportRepository) GetIncompleteTransactions(ctx context.Context, dateRange DateRange, ageThreshold time.Duration) ([]database.TimbanganPKS, error) {
	cutoffTime := time.Now().Add(-ageThreshold)

	var incomplete []database.TimbanganPKS

	err := r.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Supplier").
		Preload("Officer1").
		Preload("Officer2").
		Where("timbang1_date >= ? AND timbang1_date <= ?", dateRange.Start, dateRange.End).
		Where("status IN (?)", []string{"timbang1", "timbang2"}).
		Where("timbang1_date < ?", cutoffTime).
		Find(&incomplete).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get incomplete transactions: %w", err)
	}

	return incomplete, nil
}

// GetMissingSecondWeighing returns transactions with only first weighing
func (r *PKSReportRepository) GetMissingSecondWeighing(ctx context.Context, dateRange DateRange) ([]database.TimbanganPKS, error) {
	var missing []database.TimbanganPKS

	err := r.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Supplier").
		Preload("Officer1").
		Where("timbang1_date >= ? AND timbang1_date <= ?", dateRange.Start, dateRange.End).
		Where("timbang2_date IS NULL AND status = ?", "selesai").
		Find(&missing).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get transactions with missing second weighing: %w", err)
	}

	return missing, nil
}

// ============================================================================
// VEHICLE AND SUPPLIER STATISTICS
// ============================================================================

// GetUniqueVehicleCount returns the number of unique vehicles in the period
func (r *PKSReportRepository) GetUniqueVehicleCount(ctx context.Context, dateRange DateRange) (int, error) {
	var count int64

	err := r.db.WithContext(ctx).
		Table("timbangan_pks").
		Select("COUNT(DISTINCT id_unit)").
		Where("timbang1_date >= ? AND timbang1_date <= ?", dateRange.Start, dateRange.End).
		Scan(&count).Error

	if err != nil {
		return 0, fmt.Errorf("failed to get unique vehicle count: %w", err)
	}

	return int(count), nil
}

// TopSupplierData represents top supplier metrics
type TopSupplierData struct {
	SupplierID       uint
	SupplierName     string
	TransactionCount int
	TotalWeight      float64
}

// GetTopSuppliers returns the most active suppliers
func (r *PKSReportRepository) GetTopSuppliers(ctx context.Context, dateRange DateRange, limit int) ([]TopSupplierData, error) {
	var results []TopSupplierData

	err := r.db.WithContext(ctx).
		Table("timbangan_pks tp").
		Select(`
			ms.id as supplier_id,
			ms.nama_supplier as supplier_name,
			COUNT(*) as transaction_count,
			SUM(CASE WHEN tp.netto2 > 0 THEN tp.netto2 ELSE tp.netto END) as total_weight
		`).
		Joins("JOIN master_supplier ms ON tp.id_supplier = ms.id").
		Where("tp.timbang1_date >= ? AND tp.timbang1_date <= ?", dateRange.Start, dateRange.End).
		Group("ms.id, ms.nama_supplier").
		Order("transaction_count DESC").
		Limit(limit).
		Scan(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get top suppliers: %w", err)
	}

	return results, nil
}
