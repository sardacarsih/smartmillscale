package service

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repository"
	"gorm.io/gorm"
)

// PKSReportService handles business logic for PKS reporting
type PKSReportService struct {
	db       *gorm.DB
	repo     *repository.PKSReportRepository
	deviceID string
	cache    sync.Map // Simple in-memory cache
	cacheTTL time.Duration
}

// NewPKSReportService creates a new instance of PKS Report Service
func NewPKSReportService(db *gorm.DB, deviceID string) *PKSReportService {
	return &PKSReportService{
		db:       db,
		repo:     repository.NewPKSReportRepository(db),
		deviceID: deviceID,
		cacheTTL: 5 * time.Minute, // 5-minute cache
	}
}

// cacheKey represents a cache entry
type cacheKey struct {
	key       string
	timestamp time.Time
}

// ============================================================================
// MAIN REPORT GENERATION
// ============================================================================

// GenerateReport generates a complete report with all sections
func (s *PKSReportService) GenerateReport(ctx context.Context, req *ReportRequest) (*ReportData, error) {
	// Normalize date range
	dateRange := repository.DateRange{
		Start: req.StartDate.Truncate(24 * time.Hour),
		End:   req.EndDate.Add(24 * time.Hour).Add(-1 * time.Second), // End of day
	}

	// Convert service filters to repository filters
	repoFilters := repository.ReportFilters{
		SupplierIDs:  req.Filters.SupplierIDs,
		ProductIDs:   req.Filters.ProductIDs,
		StatusFilter: req.Filters.StatusFilter,
		GradeFilter:  req.Filters.GradeFilter,
	}

	// Generate each section
	summary, err := s.GenerateReportSummary(ctx, dateRange, repoFilters)
	if err != nil {
		return nil, fmt.Errorf("failed to generate summary: %w", err)
	}

	transactions, err := s.GetTransactionDetails(ctx, dateRange, repoFilters)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction details: %w", err)
	}

	trends, err := s.GenerateTrendAnalysis(ctx, dateRange, req.ReportType)
	if err != nil {
		return nil, fmt.Errorf("failed to generate trend analysis: %w", err)
	}

	anomalies, err := s.DetectAnomalies(ctx, dateRange)
	if err != nil {
		return nil, fmt.Errorf("failed to detect anomalies: %w", err)
	}

	metadata := ReportMetadata{
		GeneratedAt:  time.Now(),
		GeneratedBy:  "System", // TODO: Get from context
		PeriodStart:  req.StartDate,
		PeriodEnd:    req.EndDate,
		TotalRecords: len(transactions),
		Version:      "1.0",
	}

	return &ReportData{
		Summary:      *summary,
		Transactions: transactions,
		Trends:       *trends,
		Anomalies:    *anomalies,
		Metadata:     metadata,
	}, nil
}

// ============================================================================
// SUMMARY SECTION
// ============================================================================

// GenerateReportSummary generates aggregated summary metrics
func (s *PKSReportService) GenerateReportSummary(ctx context.Context, dateRange repository.DateRange, filters repository.ReportFilters) (*ReportSummary, error) {
	// Get all transactions
	transactions, err := s.repo.GetTransactionsWithDetails(ctx, dateRange, filters)
	if err != nil {
		return nil, err
	}

	// Initialize summary
	summary := &ReportSummary{
		TotalTransactions: len(transactions),
		TBSByType:         make(map[string]TBSTypeData),
		WeightSummary:     WeightSummary{},
	}

	// Get unique vehicle count
	uniqueVehicles, err := s.repo.GetUniqueVehicleCount(ctx, dateRange)
	if err != nil {
		return nil, err
	}
	summary.TotalVehicles = uniqueVehicles

	// Calculate TBS classification
	tbsData, err := s.repo.GetTBSClassificationSummary(ctx, dateRange)
	if err != nil {
		return nil, err
	}

	totalWeight := 0.0
	for _, tbs := range tbsData {
		totalWeight += tbs.TotalWeight
	}

	for _, tbs := range tbsData {
		percentage := 0.0
		if totalWeight > 0 {
			percentage = (tbs.TotalWeight / totalWeight) * 100
		}

		summary.TBSByType[tbs.SupplierType] = TBSTypeData{
			Count:       tbs.Count,
			TotalWeight: tbs.TotalWeight,
			Percentage:  percentage,
		}
	}

	// Calculate rejection metrics
	rejectionData, err := s.repo.GetRejectionsSummary(ctx, dateRange)
	if err != nil {
		return nil, err
	}

	rejectionPercentage := 0.0
	if summary.TotalTransactions > 0 {
		rejectionPercentage = (float64(rejectionData.Count) / float64(summary.TotalTransactions)) * 100
	}

	summary.TotalRejections = RejectionData{
		Count:       rejectionData.Count,
		TotalWeight: rejectionData.TotalWeight,
		Percentage:  rejectionPercentage,
		Reasons:     rejectionData.Reasons,
	}

	// Calculate weight summary
	var totalFirstWeight, totalSecondWeight, totalNetWeight, totalTareWeight float64
	var totalWeightForAverage float64

	for _, tx := range transactions {
		totalFirstWeight += tx.Bruto
		totalTareWeight += tx.Tara
		totalNetWeight += tx.Netto

		if tx.Bruto2 > 0 {
			totalSecondWeight += tx.Bruto2
			totalTareWeight += tx.Tara2
			totalNetWeight += tx.Netto2
			totalWeightForAverage += tx.Netto2
		} else {
			totalWeightForAverage += tx.Netto
		}
	}

	summary.WeightSummary = WeightSummary{
		TotalFirstWeight:  totalFirstWeight,
		TotalSecondWeight: totalSecondWeight,
		TotalNetWeight:    totalNetWeight,
		TotalTareWeight:   totalTareWeight,
	}

	// Calculate average weight
	if summary.TotalTransactions > 0 {
		summary.AverageWeight = totalWeightForAverage / float64(summary.TotalTransactions)
	}

	return summary, nil
}

// GetTransactionDetails converts database records to DTOs
func (s *PKSReportService) GetTransactionDetails(ctx context.Context, dateRange repository.DateRange, filters repository.ReportFilters) ([]TransactionDetail, error) {
	transactions, err := s.repo.GetTransactionsWithDetails(ctx, dateRange, filters)
	if err != nil {
		return nil, err
	}

	details := make([]TransactionDetail, len(transactions))
	rejectionGrades := map[string]bool{"C": true, "D": true}

	for i, tx := range transactions {
		// Determine supplier info
		supplierName := "Tidak Diketahui"
		supplierType := "TIDAK DIKETAHUI"
		var supplierID *uint

		if tx.Supplier != nil {
			supplierName = tx.Supplier.NamaSupplier
			supplierType = tx.Supplier.JenisSupplier
			supplierID = &tx.Supplier.ID
		}

		// Determine product info
		productName := "Tidak Diketahui"
		productCode := ""
		var productID *uint

		if tx.Produk.ID > 0 {
			productName = tx.Produk.NamaProduk
			productCode = tx.Produk.KodeProduk
			productID = &tx.Produk.ID
		}

		// Determine rejection status
		isRejected := tx.Status != "selesai" || rejectionGrades[tx.Grade]

		// Officer names
		officer1Name := tx.Officer1.FullName
		if officer1Name == "" {
			officer1Name = tx.Officer1.Username
		}

		officer2Name := ""
		var officer2ID *uint
		if tx.Officer2 != nil {
			officer2Name = tx.Officer2.FullName
			if officer2Name == "" {
				officer2Name = tx.Officer2.Username
			}
			if tx.Officer2.ID != [16]byte{} {
				// Convert UUID to uint pointer if needed (this is simplified)
				// In practice, you might store Officer2ID differently
			}
		}

		// Create transaction detail
		var bruto2, tara2, netto2 *float64
		if tx.Bruto2 > 0 {
			bruto2 = &tx.Bruto2
			tara2 = &tx.Tara2
			netto2 = &tx.Netto2
		}

		var officer1IDUint *uint
		// Convert Officer1ID UUID to uint if needed for API compatibility

		details[i] = TransactionDetail{
			NoTransaksi:    tx.NoTransaksi,
			Tanggal:        tx.CreatedAt,
			Timbang1Date:   tx.Timbang1Date,
			Timbang2Date:   tx.Timbang2Date,
			NomorKendaraan: tx.Unit.NomorPolisi,
			SupplierName:   supplierName,
			SupplierType:   supplierType,
			SupplierID:     supplierID,
			ProductName:    productName,
			ProductCode:    productCode,
			ProductID:      productID,
			SourceSummary:  s.resolveSourceSummary(tx),
			Grade:          tx.Grade,
			QualityGrade:   tx.Grade, // Assuming Grade and QualityGrade are the same
			Bruto:          tx.Bruto,
			Tara:           tx.Tara,
			Netto:          tx.Netto,
			Bruto2:         bruto2,
			Tara2:          tara2,
			Netto2:         netto2,
			Status:         tx.Status,
			StatusPKS:      tx.Status,
			IsRejected:     isRejected,
			Officer1Name:   officer1Name,
			Officer2Name:   officer2Name,
			Officer1ID:     officer1IDUint,
			Officer2ID:     officer2ID,
			Notes:          "", // Add if available in model
			PhotoPath:      "", // Add if available in model
			CreatedAt:      tx.CreatedAt,
			UpdatedAt:      tx.UpdatedAt,
			SyncedAt:       tx.SyncedAt,
		}
	}

	return details, nil
}

// ============================================================================
// TREND ANALYSIS SECTION
// ============================================================================

// GenerateTrendAnalysis generates time-series and distribution analysis
func (s *PKSReportService) GenerateTrendAnalysis(ctx context.Context, dateRange repository.DateRange, reportType string) (*TrendAnalysis, error) {
	analysis := &TrendAnalysis{}

	// Get daily trends
	dailyData, err := s.repo.GetDailyTrends(ctx, dateRange)
	if err != nil {
		return nil, err
	}

	analysis.DailyTrends = make([]DailyTrendPoint, len(dailyData))
	for i, data := range dailyData {
		avgWeight := 0.0
		if data.TransCount > 0 {
			avgWeight = data.TotalWeight / float64(data.TransCount)
		}

		analysis.DailyTrends[i] = DailyTrendPoint{
			Date:        data.Date,
			TotalWeight: data.TotalWeight,
			TransCount:  data.TransCount,
			AvgWeight:   avgWeight,
		}
	}

	// Get hourly distribution (only for daily reports)
	if reportType == "daily" && dateRange.Start.Format("2006-01-02") == dateRange.End.Format("2006-01-02") {
		hourlyData, err := s.repo.GetHourlyDistribution(ctx, dateRange.Start)
		if err != nil {
			return nil, err
		}

		analysis.HourlyDistribution = make([]HourlyDistributionPoint, len(hourlyData))
		for i, data := range hourlyData {
			analysis.HourlyDistribution[i] = HourlyDistributionPoint{
				Hour:  data.Hour,
				Count: data.Count,
			}
		}
	}

	// Get TBS source distribution
	tbsData, err := s.repo.GetTBSClassificationSummary(ctx, dateRange)
	if err != nil {
		return nil, err
	}

	totalWeight := 0.0
	totalCount := 0
	for _, tbs := range tbsData {
		totalWeight += tbs.TotalWeight
		totalCount += tbs.Count
	}

	analysis.SourceDistribution = make([]SourceDistributionPoint, len(tbsData))
	for i, tbs := range tbsData {
		percentage := 0.0
		if totalWeight > 0 {
			percentage = (tbs.TotalWeight / totalWeight) * 100
		}

		analysis.SourceDistribution[i] = SourceDistributionPoint{
			Name:       tbs.SupplierType,
			Value:      tbs.TotalWeight,
			Count:      tbs.Count,
			Percentage: percentage,
		}
	}

	// Get grade distribution
	gradeData, err := s.repo.GetGradeDistribution(ctx, dateRange)
	if err != nil {
		return nil, err
	}

	analysis.GradeDistribution = make([]GradeDistributionPoint, len(gradeData))
	for i, grade := range gradeData {
		percentage := 0.0
		if totalCount > 0 {
			percentage = (float64(grade.Count) / float64(totalCount)) * 100
		}

		analysis.GradeDistribution[i] = GradeDistributionPoint{
			Grade:      grade.Grade,
			Count:      grade.Count,
			Weight:     grade.Weight,
			Percentage: percentage,
		}
	}

	return analysis, nil
}

// ============================================================================
// ANOMALY DETECTION SECTION
// ============================================================================

// DetectAnomalies identifies unusual patterns in the data
func (s *PKSReportService) DetectAnomalies(ctx context.Context, dateRange repository.DateRange) (*AnomalyReport, error) {
	report := &AnomalyReport{
		Summary: AnomalySummary{},
	}

	// Detect weight outliers (z-score > 2)
	outlierTxs, zScores, err := s.repo.DetectWeightOutliers(ctx, dateRange, 2.0)
	if err != nil {
		return nil, err
	}

	report.OutlierTransactions = make([]OutlierTransaction, len(outlierTxs))
	for i, tx := range outlierTxs {
		weight := tx.Netto
		if tx.Netto2 > 0 {
			weight = tx.Netto2
		}

		reason := "Unusually high weight"
		if zScores[i] < 0 {
			reason = "Unusually low weight"
		}

		// Convert to TransactionDetail
		detail := s.convertToTransactionDetail(tx)

		report.OutlierTransactions[i] = OutlierTransaction{
			Transaction: detail,
			ZScore:      zScores[i],
			Deviation:   zScores[i] * weight, // Simplified calculation
			Reason:      reason,
		}
	}
	report.Summary.TotalOutliers = len(outlierTxs)

	// Detect incomplete transactions (age > 24 hours)
	incompleteTxs, err := s.repo.GetIncompleteTransactions(ctx, dateRange, 24*time.Hour)
	if err != nil {
		return nil, err
	}

	report.IncompleteTransactions = make([]IncompleteTransaction, len(incompleteTxs))
	for i, tx := range incompleteTxs {
		ageHours := time.Since(tx.Timbang1Date).Hours()
		reason := fmt.Sprintf("Stuck in %s for %.1f hours", tx.Status, ageHours)

		detail := s.convertToTransactionDetail(tx)

		report.IncompleteTransactions[i] = IncompleteTransaction{
			Transaction: detail,
			AgeHours:    ageHours,
			Stage:       strings.ToUpper(tx.Status),
			Reason:      reason,
		}
	}
	report.Summary.TotalIncomplete = len(incompleteTxs)

	// Detect duplicate vehicles
	duplicateData, err := s.repo.FindDuplicateVehicles(ctx, dateRange)
	if err != nil {
		return nil, err
	}

	report.DuplicateVehicles = make([]DuplicateVehicleEntry, len(duplicateData))
	for i, dup := range duplicateData {
		txIDs := strings.Split(dup.TransactionIDs, ",")
		report.DuplicateVehicles[i] = DuplicateVehicleEntry{
			VehicleNumber:  dup.VehicleNumber,
			Count:          dup.Count,
			TransactionIDs: txIDs,
		}
	}
	report.Summary.TotalDuplicates = len(duplicateData)

	// Detect missing second weighing
	missingSecond, err := s.repo.GetMissingSecondWeighing(ctx, dateRange)
	if err != nil {
		return nil, err
	}

	report.MissingSecondWeighing = make([]TransactionDetail, len(missingSecond))
	for i, tx := range missingSecond {
		report.MissingSecondWeighing[i] = s.convertToTransactionDetail(tx)
	}
	report.Summary.TotalMissingSecond = len(missingSecond)

	return report, nil
}

// Helper function to convert database model to DTO
func (s *PKSReportService) convertToTransactionDetail(tx database.TimbanganPKS) TransactionDetail {
	supplierName := "Tidak Diketahui"
	supplierType := "TIDAK DIKETAHUI"
	var supplierID *uint

	if tx.Supplier != nil {
		supplierName = tx.Supplier.NamaSupplier
		supplierType = tx.Supplier.JenisSupplier
		supplierID = &tx.Supplier.ID
	}

	productName := "Tidak Diketahui"
	productCode := ""
	var productID *uint

	if tx.Produk.ID > 0 {
		productName = tx.Produk.NamaProduk
		productCode = tx.Produk.KodeProduk
		productID = &tx.Produk.ID
	}

	vehicleNumber := ""
	if tx.Unit.ID > 0 {
		vehicleNumber = tx.Unit.NomorPolisi
	}

	officer1Name := tx.Officer1.FullName
	if officer1Name == "" {
		officer1Name = tx.Officer1.Username
	}

	officer2Name := ""
	if tx.Officer2 != nil {
		officer2Name = tx.Officer2.FullName
		if officer2Name == "" {
			officer2Name = tx.Officer2.Username
		}
	}

	isRejected := tx.Status != "selesai" || tx.Grade == "C" || tx.Grade == "D"

	var bruto2, tara2, netto2 *float64
	if tx.Bruto2 > 0 {
		bruto2 = &tx.Bruto2
		tara2 = &tx.Tara2
		netto2 = &tx.Netto2
	}

	return TransactionDetail{
		NoTransaksi:    tx.NoTransaksi,
		Tanggal:        tx.CreatedAt,
		Timbang1Date:   tx.Timbang1Date,
		Timbang2Date:   tx.Timbang2Date,
		NomorKendaraan: vehicleNumber,
		SupplierName:   supplierName,
		SupplierType:   supplierType,
		SupplierID:     supplierID,
		ProductName:    productName,
		ProductCode:    productCode,
		ProductID:      productID,
		SourceSummary:  s.resolveSourceSummary(tx),
		Grade:          tx.Grade,
		QualityGrade:   tx.Grade,
		Bruto:          tx.Bruto,
		Tara:           tx.Tara,
		Netto:          tx.Netto,
		Bruto2:         bruto2,
		Tara2:          tara2,
		Netto2:         netto2,
		Status:         tx.Status,
		StatusPKS:      tx.Status,
		IsRejected:     isRejected,
		Officer1Name:   officer1Name,
		Officer2Name:   officer2Name,
		CreatedAt:      tx.CreatedAt,
		UpdatedAt:      tx.UpdatedAt,
		SyncedAt:       tx.SyncedAt,
	}
}

func (s *PKSReportService) resolveSourceSummary(tx database.TimbanganPKS) string {
	detailCount := len(tx.TBSBlockDetails)
	if detailCount > 1 {
		return fmt.Sprintf("Campuran (%d blok)", detailCount)
	}

	if detailCount == 1 {
		detail := tx.TBSBlockDetails[0]
		if detail.Blok.KodeBlok != "" && detail.Blok.NamaBlok != "" {
			return fmt.Sprintf("%s - %s", detail.Blok.KodeBlok, detail.Blok.NamaBlok)
		}
		if detail.Blok.NamaBlok != "" {
			return detail.Blok.NamaBlok
		}
		if detail.Blok.KodeBlok != "" {
			return detail.Blok.KodeBlok
		}
		return fmt.Sprintf("Blok #%d", detail.IDBlok)
	}

	if tx.Blok != nil {
		if tx.Blok.KodeBlok != "" && tx.Blok.NamaBlok != "" {
			return fmt.Sprintf("%s - %s", tx.Blok.KodeBlok, tx.Blok.NamaBlok)
		}
		if tx.Blok.NamaBlok != "" {
			return tx.Blok.NamaBlok
		}
		if tx.Blok.KodeBlok != "" {
			return tx.Blok.KodeBlok
		}
	}

	if tx.Afdeling != nil && tx.Afdeling.NamaAfdeling != "" {
		if tx.Estate != nil && tx.Estate.NamaEstate != "" {
			return fmt.Sprintf("%s / %s", tx.Estate.NamaEstate, tx.Afdeling.NamaAfdeling)
		}
		return tx.Afdeling.NamaAfdeling
	}

	if tx.Estate != nil && tx.Estate.NamaEstate != "" {
		return tx.Estate.NamaEstate
	}

	if tx.SumberTBS != "" {
		return tx.SumberTBS
	}

	return "-"
}

// ============================================================================
// CSV EXPORT
// ============================================================================

// ExportToCSV converts report data to CSV format
func (s *PKSReportService) ExportToCSV(data *ReportData) (string, error) {
	var builder strings.Builder

	// Header
	builder.WriteString("LAPORAN TIMBANGAN PKS\n")
	builder.WriteString(fmt.Sprintf("Periode: %s s/d %s\n",
		data.Metadata.PeriodStart.Format("02/01/2006"),
		data.Metadata.PeriodEnd.Format("02/01/2006")))
	builder.WriteString(fmt.Sprintf("Dibuat: %s\n", data.Metadata.GeneratedAt.Format("02/01/2006 15:04:05")))
	builder.WriteString("\n")

	// Summary section
	builder.WriteString("=== RINGKASAN ===\n")
	builder.WriteString(fmt.Sprintf("Total Transaksi,%d\n", data.Summary.TotalTransactions))
	builder.WriteString(fmt.Sprintf("Total Kendaraan,%d\n", data.Summary.TotalVehicles))
	builder.WriteString(fmt.Sprintf("Total Berat Bersih,%.2f kg\n", data.Summary.WeightSummary.TotalNetWeight))
	builder.WriteString(fmt.Sprintf("Rata-rata Berat,%.2f kg\n", data.Summary.AverageWeight))
	builder.WriteString(fmt.Sprintf("Total Afkir,%d (%.2f%%)\n",
		data.Summary.TotalRejections.Count,
		data.Summary.TotalRejections.Percentage))
	builder.WriteString("\n")

	// TBS Classification
	builder.WriteString("=== KLASIFIKASI TBS ===\n")
	builder.WriteString("Tipe,Jumlah,Berat (kg),Persentase\n")
	for tbsType, data := range data.Summary.TBSByType {
		builder.WriteString(fmt.Sprintf("%s,%d,%.2f,%.2f%%\n",
			tbsType, data.Count, data.TotalWeight, data.Percentage))
	}
	builder.WriteString("\n")

	// Detail transactions
	builder.WriteString("=== DETAIL TRANSAKSI ===\n")
	builder.WriteString("No Transaksi,Tanggal,Nomor Kendaraan,Supplier,Tipe TBS,Sumber TBS,Produk,Grade,Bruto,Bruto2,Netto,Netto2,Status,Petugas 1,Petugas 2\n")

	for _, tx := range data.Transactions {
		timbang1 := tx.Timbang1Date.Format("02/01/2006 15:04")

		bruto2Str := "-"
		netto2Str := "-"
		if tx.Bruto2 != nil {
			bruto2Str = fmt.Sprintf("%.2f", *tx.Bruto2)
			netto2Str = fmt.Sprintf("%.2f", *tx.Netto2)
		}

		status := tx.Status
		if tx.IsRejected {
			status = "AFKIR"
		}

		builder.WriteString(fmt.Sprintf("%s,%s,%s,%s,%s,%s,%s,%s,%.2f,%s,%.2f,%s,%s,%s,%s\n",
			tx.NoTransaksi,
			timbang1,
			tx.NomorKendaraan,
			tx.SupplierName,
			tx.SupplierType,
			tx.SourceSummary,
			tx.ProductName,
			tx.Grade,
			tx.Bruto,
			bruto2Str,
			tx.Netto,
			netto2Str,
			status,
			tx.Officer1Name,
			tx.Officer2Name,
		))
	}

	return builder.String(), nil
}

// ============================================================================
// OPERATIONAL CONCLUSIONS (Helper Methods)
// ============================================================================

// GenerateOperationalConclusions derives business insights from report data
func (s *PKSReportService) GenerateOperationalConclusions(ctx context.Context, data *ReportData, dateRange repository.DateRange) (*OperationalConclusions, error) {
	conclusions := &OperationalConclusions{
		Recommendations: []string{},
	}

	// Find peak hours from hourly distribution
	if len(data.Trends.HourlyDistribution) > 0 {
		maxCount := 0
		for _, h := range data.Trends.HourlyDistribution {
			if h.Count > maxCount {
				maxCount = h.Count
			}
		}

		for _, h := range data.Trends.HourlyDistribution {
			if h.Count == maxCount {
				conclusions.PeakHours = append(conclusions.PeakHours, h.Hour)
			}
		}
	}

	// Get top suppliers
	topSuppliers, err := s.repo.GetTopSuppliers(ctx, dateRange, 5)
	if err == nil {
		conclusions.TopSuppliers = make([]TopSupplierData, len(topSuppliers))
		for i, sup := range topSuppliers {
			conclusions.TopSuppliers[i] = TopSupplierData{
				SupplierName:     sup.SupplierName,
				TransactionCount: sup.TransactionCount,
				TotalWeight:      sup.TotalWeight,
				Rank:             i + 1,
			}
		}
	}

	// Quality summary
	passRate := 100.0 - data.Summary.TotalRejections.Percentage
	conclusions.QualitySummary = QualitySummary{
		PassRate:       passRate,
		RejectionRate:  data.Summary.TotalRejections.Percentage,
		GradeBreakdown: make(map[string]int),
	}

	// Find top grade
	maxGradeCount := 0
	topGrade := "-"
	for _, grade := range data.Trends.GradeDistribution {
		conclusions.QualitySummary.GradeBreakdown[grade.Grade] = grade.Count
		if grade.Count > maxGradeCount {
			maxGradeCount = grade.Count
			topGrade = grade.Grade
		}
	}
	conclusions.QualitySummary.TopGrade = topGrade

	// Generate recommendations
	if data.Summary.TotalRejections.Percentage > 10 {
		conclusions.Recommendations = append(conclusions.Recommendations,
			fmt.Sprintf("Tingkat afkir tinggi (%.1f%%). Perlu evaluasi kualitas TBS dari supplier.", data.Summary.TotalRejections.Percentage))
	}

	if data.Anomalies.Summary.TotalIncomplete > 0 {
		conclusions.Recommendations = append(conclusions.Recommendations,
			fmt.Sprintf("%d transaksi belum selesai. Tindak lanjuti transaksi yang tertunda.", data.Anomalies.Summary.TotalIncomplete))
	}

	if data.Anomalies.Summary.TotalDuplicates > 0 {
		conclusions.Recommendations = append(conclusions.Recommendations,
			fmt.Sprintf("%d kendaraan dengan transaksi ganda. Periksa kemungkinan duplikasi data.", data.Anomalies.Summary.TotalDuplicates))
	}

	if len(conclusions.Recommendations) == 0 {
		conclusions.Recommendations = append(conclusions.Recommendations, "Operasional berjalan normal. Pertahankan kualitas layanan.")
	}

	return conclusions, nil
}

// ============================================================================
// ADDITIONAL SERVICE METHODS FOR WAILS INTEGRATION
// ============================================================================

// GetFilterOptions returns available filter options for reports
func (s *PKSReportService) GetFilterOptions(ctx context.Context) (*ReportFilterOptions, error) {
	options := &ReportFilterOptions{
		Suppliers: []FilterOption{},
		Products:  []FilterOption{},
		Grades:    []FilterOption{},
		Statuses:  []FilterOption{},
	}

	// Get suppliers
	var suppliers []database.MasterSupplier
	if err := s.db.WithContext(ctx).Where("is_active = ?", true).Find(&suppliers).Error; err != nil {
		return nil, fmt.Errorf("failed to get suppliers: %w", err)
	}

	for _, supplier := range suppliers {
		options.Suppliers = append(options.Suppliers, FilterOption{
			Value: fmt.Sprintf("%d", supplier.ID),
			Label: supplier.NamaSupplier,
			Data:  map[string]interface{}{"jenis_supplier": supplier.JenisSupplier},
		})
	}

	// Get products
	var products []database.MasterProduk
	if err := s.db.WithContext(ctx).Where("is_active = ?", true).Find(&products).Error; err != nil {
		return nil, fmt.Errorf("failed to get products: %w", err)
	}

	for _, product := range products {
		options.Products = append(options.Products, FilterOption{
			Value: fmt.Sprintf("%d", product.ID),
			Label: product.NamaProduk,
			Data:  map[string]interface{}{"kategori": product.Kategori},
		})
	}

	// Add grade options
	gradeOptions := []string{"A", "B", "C", "D", "TIDAK ADA"}
	for _, grade := range gradeOptions {
		options.Grades = append(options.Grades, FilterOption{
			Value: grade,
			Label: grade,
		})
	}

	// Add status options
	statusOptions := []string{
		"all", "timbang1", "timbang2", "selesai", "batal",
	}
	statusLabels := map[string]string{
		"all":      "Semua Status",
		"timbang1": "Timbang 1",
		"timbang2": "Timbang 2",
		"selesai":  "Selesai",
		"batal":    "Batal",
	}

	for _, status := range statusOptions {
		label, exists := statusLabels[status]
		if !exists {
			label = status
		}
		options.Statuses = append(options.Statuses, FilterOption{
			Value: status,
			Label: label,
		})
	}

	return options, nil
}

// EstimateRecordCount estimates the number of records for a date range
func (s *PKSReportService) EstimateRecordCount(ctx context.Context, startDate, endDate time.Time) (int, error) {
	var count int64

	err := s.db.WithContext(ctx).
		Model(&database.TimbanganPKS{}).
		Where("timbang1_date >= ? AND timbang1_date <= ?", startDate, endDate).
		Count(&count).Error

	if err != nil {
		return 0, fmt.Errorf("failed to estimate record count: %w", err)
	}

	return int(count), nil
}
