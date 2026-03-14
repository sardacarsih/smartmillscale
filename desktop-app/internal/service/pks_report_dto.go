package service

import "time"

// ============================================================================
// REQUEST DTOs
// ============================================================================

// ReportRequest represents the parameters for generating a report
type ReportRequest struct {
	StartDate  time.Time     `json:"startDate"`
	EndDate    time.Time     `json:"endDate"`
	ReportType string        `json:"reportType"` // "daily", "range", "custom"
	Filters    ReportFilters `json:"filters"`
}

// ReportFilters contains optional filtering parameters
type ReportFilters struct {
	SupplierIDs  []uint   `json:"supplierIds"`
	ProductIDs   []uint   `json:"productIds"`
	StatusFilter string   `json:"statusFilter"` // "all", "completed", "rejected"
	GradeFilter  []string `json:"gradeFilter"`
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

// ReportData is the main response structure containing all report sections
type ReportData struct {
	Summary      ReportSummary       `json:"summary"`
	Transactions []TransactionDetail `json:"transactions"`
	Trends       TrendAnalysis       `json:"trends"`
	Anomalies    AnomalyReport       `json:"anomalies"`
	Metadata     ReportMetadata      `json:"metadata"`
}

// ============================================================================
// SUMMARY SECTION
// ============================================================================

// ReportSummary contains aggregated metrics for the report period
type ReportSummary struct {
	TotalTransactions int                    `json:"totalTransactions"`
	TotalVehicles     int                    `json:"totalVehicles"`
	TBSByType         map[string]TBSTypeData `json:"tbsByType"` // "PETANI", "PLASMA", "AGEN"
	TotalRejections   RejectionData          `json:"totalRejections"`
	WeightSummary     WeightSummary          `json:"weightSummary"`
	AverageWeight     float64                `json:"averageWeight"`
}

// TBSTypeData contains metrics for a specific TBS source type
type TBSTypeData struct {
	Count       int     `json:"count"`
	TotalWeight float64 `json:"totalWeight"`
	Percentage  float64 `json:"percentage"`
}

// RejectionData contains rejection/afkir metrics
type RejectionData struct {
	Count       int            `json:"count"`
	TotalWeight float64        `json:"totalWeight"`
	Percentage  float64        `json:"percentage"`
	Reasons     map[string]int `json:"reasons"` // Reason -> count (e.g., "Grade C": 5, "Incomplete": 3)
}

// WeightSummary contains total weights across all measurements
type WeightSummary struct {
	TotalFirstWeight  float64 `json:"totalFirstWeight"`  // Sum of Bruto
	TotalSecondWeight float64 `json:"totalSecondWeight"` // Sum of Bruto2
	TotalNetWeight    float64 `json:"totalNetWeight"`    // Sum of Netto/Netto2
	TotalTareWeight   float64 `json:"totalTareWeight"`   // Sum of Tara/Tara2
}

// ============================================================================
// TRANSACTION DETAIL SECTION
// ============================================================================

// TransactionDetail contains complete details for a single transaction
type TransactionDetail struct {
	NoTransaksi    string     `json:"noTransaksi"`
	Tanggal        time.Time  `json:"tanggal"`
	Timbang1Date   time.Time  `json:"timbang1Date"`
	Timbang2Date   *time.Time `json:"timbang2Date,omitempty"`
	NomorKendaraan string     `json:"nomorKendaraan"`

	// Supplier information
	SupplierName string `json:"supplierName"`
	SupplierType string `json:"supplierType"` // PETANI, PLASMA, AGEN (from JenisSupplier)
	SupplierID   *uint  `json:"supplierId,omitempty"`

	// Product information
	ProductName string `json:"productName"`
	ProductCode string `json:"productCode,omitempty"`
	ProductID   *uint  `json:"productId,omitempty"`
	// Source summary for TBS origin (single block, estate/afdeling fallback, or mixed blocks)
	SourceSummary string `json:"sourceSummary,omitempty"`

	// Quality grading
	Grade        string `json:"grade"`
	QualityGrade string `json:"qualityGrade"`

	// Weight measurements
	Bruto  float64  `json:"bruto"`            // First weighing gross
	Tara   float64  `json:"tara"`             // First weighing tare
	Netto  float64  `json:"netto"`            // First weighing net
	Bruto2 *float64 `json:"bruto2,omitempty"` // Second weighing gross
	Tara2  *float64 `json:"tara2,omitempty"`  // Second weighing tare
	Netto2 *float64 `json:"netto2,omitempty"` // Second weighing net

	// Status
	Status     string `json:"status"`     // DRAFT, TIMBANG1, TIMBANG2, COMPLETED
	StatusPKS  string `json:"statusPKS"`  // Original status field
	IsRejected bool   `json:"isRejected"` // Derived from StatusPKS != COMPLETED or Grade in rejection list

	// Officers
	Officer1Name string `json:"officer1Name"`
	Officer2Name string `json:"officer2Name,omitempty"`
	Officer1ID   *uint  `json:"officer1Id,omitempty"`
	Officer2ID   *uint  `json:"officer2Id,omitempty"`

	// Additional details
	Notes     string `json:"notes,omitempty"`
	PhotoPath string `json:"photoPath,omitempty"`

	// Metadata
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	SyncedAt  *time.Time `json:"syncedAt,omitempty"`
}

// ============================================================================
// TREND ANALYSIS SECTION
// ============================================================================

// TrendAnalysis contains time-series and distribution data
type TrendAnalysis struct {
	DailyTrends        []DailyTrendPoint         `json:"dailyTrends"`
	HourlyDistribution []HourlyDistributionPoint `json:"hourlyDistribution,omitempty"` // Only for daily reports
	SourceDistribution []SourceDistributionPoint `json:"sourceDistribution"`
	GradeDistribution  []GradeDistributionPoint  `json:"gradeDistribution"`
}

// DailyTrendPoint represents aggregated data for a single day
type DailyTrendPoint struct {
	Date        string  `json:"date"` // Format: "2006-01-02"
	TotalWeight float64 `json:"totalWeight"`
	TransCount  int     `json:"transCount"`
	AvgWeight   float64 `json:"avgWeight"`
}

// HourlyDistributionPoint represents transaction count per hour
type HourlyDistributionPoint struct {
	Hour  int `json:"hour"`  // 0-23
	Count int `json:"count"` // Number of transactions in this hour
}

// SourceDistributionPoint represents distribution by TBS source
type SourceDistributionPoint struct {
	Name       string  `json:"name"`       // PETANI, PLASMA, AGEN
	Value      float64 `json:"value"`      // Total weight
	Count      int     `json:"count"`      // Transaction count
	Percentage float64 `json:"percentage"` // Percentage of total
}

// GradeDistributionPoint represents distribution by quality grade
type GradeDistributionPoint struct {
	Grade      string  `json:"grade"`      // A, B, C, D, etc.
	Count      int     `json:"count"`      // Number of transactions
	Weight     float64 `json:"weight"`     // Total weight for this grade
	Percentage float64 `json:"percentage"` // Percentage of total transactions
}

// ============================================================================
// ANOMALY DETECTION SECTION
// ============================================================================

// AnomalyReport contains detected anomalies in the data
type AnomalyReport struct {
	OutlierTransactions    []OutlierTransaction    `json:"outlierTransactions"`
	IncompleteTransactions []IncompleteTransaction `json:"incompleteTransactions"`
	DuplicateVehicles      []DuplicateVehicleEntry `json:"duplicateVehicles"`
	MissingSecondWeighing  []TransactionDetail     `json:"missingSecondWeighing"`
	Summary                AnomalySummary          `json:"summary"`
}

// OutlierTransaction represents a transaction with unusual weight
type OutlierTransaction struct {
	Transaction TransactionDetail `json:"transaction"`
	ZScore      float64           `json:"zScore"`    // Statistical z-score
	Deviation   float64           `json:"deviation"` // Deviation from mean (kg)
	Reason      string            `json:"reason"`    // "Unusually high" or "Unusually low"
}

// IncompleteTransaction represents a transaction stuck in progress
type IncompleteTransaction struct {
	Transaction TransactionDetail `json:"transaction"`
	AgeHours    float64           `json:"ageHours"` // Hours since Timbang1Date
	Stage       string            `json:"stage"`    // "TIMBANG1", "TIMBANG2"
	Reason      string            `json:"reason"`   // Why it's incomplete
}

// DuplicateVehicleEntry represents a vehicle with multiple transactions
type DuplicateVehicleEntry struct {
	VehicleNumber  string   `json:"vehicleNumber"`
	Count          int      `json:"count"`          // Number of transactions
	TransactionIDs []string `json:"transactionIds"` // List of NoTransaksi
}

// AnomalySummary provides overview of detected anomalies
type AnomalySummary struct {
	TotalOutliers      int `json:"totalOutliers"`
	TotalIncomplete    int `json:"totalIncomplete"`
	TotalDuplicates    int `json:"totalDuplicates"`
	TotalMissingSecond int `json:"totalMissingSecond"`
}

// ============================================================================
// METADATA SECTION
// ============================================================================

// ReportMetadata contains information about the report generation
type ReportMetadata struct {
	GeneratedAt  time.Time `json:"generatedAt"`
	GeneratedBy  string    `json:"generatedBy"` // Username
	PeriodStart  time.Time `json:"periodStart"`
	PeriodEnd    time.Time `json:"periodEnd"`
	TotalRecords int       `json:"totalRecords"` // Total transactions in report
	Version      string    `json:"version"`      // Report version/format version
}

// ============================================================================
// OPERATIONAL CONCLUSIONS (Derived Data)
// ============================================================================

// OperationalConclusions contains business insights derived from the data
type OperationalConclusions struct {
	PeakHours       []int             `json:"peakHours"`       // Hours with most activity
	TopSuppliers    []TopSupplierData `json:"topSuppliers"`    // Most active suppliers
	QualitySummary  QualitySummary    `json:"qualitySummary"`  // Quality metrics
	Recommendations []string          `json:"recommendations"` // System-generated recommendations
}

// TopSupplierData represents top performing suppliers
type TopSupplierData struct {
	SupplierName     string  `json:"supplierName"`
	TransactionCount int     `json:"transactionCount"`
	TotalWeight      float64 `json:"totalWeight"`
	Rank             int     `json:"rank"`
}

// QualitySummary contains quality-related metrics
type QualitySummary struct {
	PassRate       float64        `json:"passRate"`       // % of completed transactions
	RejectionRate  float64        `json:"rejectionRate"`  // % of rejected transactions
	TopGrade       string         `json:"topGrade"`       // Most common grade
	GradeBreakdown map[string]int `json:"gradeBreakdown"` // Grade -> count
}

// ============================================================================
// ADDITIONAL DTOs FOR WAILS INTEGRATION
// ============================================================================

// DatePreset represents a predefined date range option
type DatePreset struct {
	Key         string    `json:"key"`
	Label       string    `json:"label"`
	Description string    `json:"description"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
}

// ReportFilterOptions contains available filter options for reports
type ReportFilterOptions struct {
	Suppliers []FilterOption `json:"suppliers"`
	Products  []FilterOption `json:"products"`
	Grades    []FilterOption `json:"grades"`
	Statuses  []FilterOption `json:"statuses"`
}

// FilterOption represents a single filter option
type FilterOption struct {
	Value string      `json:"value"`
	Label string      `json:"label"`
	Count int         `json:"count,omitempty"`
	Data  interface{} `json:"data,omitempty"`
}

// ValidationResult contains validation results for report requests
type ValidationResult struct {
	IsValid  bool     `json:"isValid"`
	Errors   []string `json:"errors"`
	Warnings []string `json:"warnings"`
}
