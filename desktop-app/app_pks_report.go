package main

import (
	"context"
	"fmt"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// GeneratePKSReport generates a comprehensive PKS report
// @Summary Generate PKS Report
// @Description Generates a comprehensive PKS report with transactions, trends, and anomaly detection
// @Tags PKS Reporting
// @Accept json
// @Produce json
// @Param request body service.ReportRequest true "Report request parameters"
// @Success 200 {object} service.ReportData
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/pks/report [post]
func (a *App) GeneratePKSReport(ctx context.Context, req *service.ReportRequest) (*service.ReportData, error) {
	// Validate request
	if req == nil {
		return nil, fmt.Errorf("request cannot be nil")
	}

	if req.StartDate.IsZero() || req.EndDate.IsZero() {
		return nil, fmt.Errorf("start date and end date are required")
	}

	if req.EndDate.Before(req.StartDate) {
		return nil, fmt.Errorf("end date must be after start date")
	}

	// Set defaults
	if req.ReportType == "" {
		req.ReportType = "summary"
	}

	// Generate report
	if a.application == nil || a.application.Container == nil || a.application.Container.PKSReportController == nil {
		return nil, fmt.Errorf("PKS report controller not available")
	}

	reportData, err := a.application.Container.PKSReportController.GenerateReport(ctx, req)
	if err != nil {
		runtime.LogErrorf(ctx, "Failed to generate PKS report: %v", err)
		return nil, fmt.Errorf("failed to generate report: %w", err)
	}

	// Log for audit
	runtime.LogInfof(ctx, "Generated PKS report for period %s to %s with %d records",
		req.StartDate.Format("2006-01-02"),
		req.EndDate.Format("2006-01-02"),
		len(reportData.Transactions))

	return reportData, nil
}

// GetPKSReportSummary generates only the summary section for quick preview
// @Summary Get PKS Report Summary
// @Description Generates summary statistics without full transaction details
// @Tags PKS Reporting
// @Accept json
// @Produce json
// @Param request body service.ReportRequest true "Report request parameters"
// @Success 200 {object} service.ReportSummary
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/pks/report/summary [post]
func (a *App) GetPKSReportSummary(ctx context.Context, req *service.ReportRequest) (*service.ReportSummary, error) {
	// Validate request
	if req == nil {
		return nil, fmt.Errorf("request cannot be nil")
	}

	if req.StartDate.IsZero() || req.EndDate.IsZero() {
		return nil, fmt.Errorf("start date and end date are required")
	}

	// Generate summary
	if a.application == nil || a.application.Container == nil || a.application.Container.PKSReportController == nil {
		return nil, fmt.Errorf("PKS report controller not available")
	}

	summary, err := a.application.Container.PKSReportController.GetReportSummary(ctx, req)
	if err != nil {
		runtime.LogErrorf(ctx, "Failed to generate PKS report summary: %v", err)
		return nil, fmt.Errorf("failed to generate summary: %w", err)
	}

	return summary, nil
}

// ExportPKSReportToCSV exports PKS report data to CSV format
// @Summary Export PKS Report to CSV
// @Description Exports PKS report data in CSV format for download
// @Tags PKS Reporting
// @Accept json
// @Produce text/csv
// @Param request body service.ReportRequest true "Report request parameters"
// @Success 200 {string} string "CSV data"
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/pks/report/export/csv [post]
func (a *App) ExportPKSReportToCSV(ctx context.Context, req *service.ReportRequest) (string, error) {
	// Validate request
	if req == nil {
		return "", fmt.Errorf("request cannot be nil")
	}

	if req.StartDate.IsZero() || req.EndDate.IsZero() {
		return "", fmt.Errorf("start date and end date are required")
	}

	// Export to CSV
	if a.application == nil || a.application.Container == nil || a.application.Container.PKSReportController == nil {
		return "", fmt.Errorf("PKS report controller not available")
	}

	csvData, err := a.application.Container.PKSReportController.ExportReportCSV(ctx, req)
	if err != nil {
		runtime.LogErrorf(ctx, "Failed to export PKS report to CSV: %v", err)
		return "", fmt.Errorf("failed to export to CSV: %w", err)
	}

	// Log for audit
	runtime.LogInfof(ctx, "Exported PKS report to CSV for period %s to %s",
		req.StartDate.Format("2006-01-02"),
		req.EndDate.Format("2006-01-02"))

	return csvData, nil
}

// ExportPKSReportToExcel exports PKS report data to Excel format with multiple sheets
// @Summary Export PKS Report to Excel
// @Description Exports PKS report data in Excel format with multiple sheets and styling
// @Tags PKS Reporting
// @Accept json
// @Produce application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Param request body service.ReportRequest true "Report request parameters"
// @Success 200 {array} byte "Excel file binary data"
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/pks/report/export/excel [post]
func (a *App) ExportPKSReportToExcel(ctx context.Context, req *service.ReportRequest) ([]byte, error) {
	// Validate request
	if req == nil {
		return nil, fmt.Errorf("request cannot be nil")
	}

	if req.StartDate.IsZero() || req.EndDate.IsZero() {
		return nil, fmt.Errorf("start date and end date are required")
	}

	// Show progress for large exports
	runtime.EventsEmit(ctx, "export_progress", map[string]interface{}{
		"status":  "started",
		"message": "Generating Excel report...",
	})

	// Export to Excel
	if a.application == nil || a.application.Container == nil || a.application.Container.PKSReportController == nil {
		return nil, fmt.Errorf("PKS report controller not available")
	}

	excelBytes, err := a.application.Container.PKSReportController.ExportReportExcel(ctx, req)
	if err != nil {
		runtime.LogErrorf(ctx, "Failed to export PKS report to Excel: %v", err)
		runtime.EventsEmit(ctx, "export_progress", map[string]interface{}{
			"status":  "error",
			"message": fmt.Sprintf("Export failed: %v", err),
		})
		return nil, fmt.Errorf("failed to export to Excel: %w", err)
	}

	// Log for audit
	runtime.LogInfof(ctx, "Exported PKS report to Excel (%d bytes) for period %s to %s",
		len(excelBytes),
		req.StartDate.Format("2006-01-02"),
		req.EndDate.Format("2006-01-02"))

	// Send completion event
	runtime.EventsEmit(ctx, "export_progress", map[string]interface{}{
		"status":  "completed",
		"message": "Excel export completed successfully",
		"size":    len(excelBytes),
	})

	return excelBytes, nil
}

// GetPKSReportDatePresets returns predefined date range options for reports
// @Summary Get PKS Report Date Presets
// @Description Returns predefined date range options (today, this week, this month, etc.)
// @Tags PKS Reporting
// @Produce json
// @Success 200 {array} service.DatePreset
// @Router /api/pks/report/date-presets [get]
func (a *App) GetPKSReportDatePresets(ctx context.Context) ([]service.DatePreset, error) {
	now := time.Now()

	// Calculate date ranges
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Start of week (Monday)
	weekday := int(now.Weekday())
	if weekday == 0 { // Sunday
		weekday = 7
	}
	thisWeekStart := today.AddDate(0, 0, -(weekday - 1))

	// Start of month
	thisMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Start of quarter
	quarter := (now.Month() - 1) / 3
	thisQuarterStart := time.Date(now.Year(), quarter*3+1, 1, 0, 0, 0, 0, now.Location())

	// Start of year
	thisYearStart := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())

	// Last 7 days, 30 days, 90 days
	last7Days := today.AddDate(0, 0, -7)
	last30Days := today.AddDate(0, 0, -30)
	last90Days := today.AddDate(0, 0, -90)

	presets := []service.DatePreset{
		{
			Key:         "today",
			Label:       "Hari Ini",
			Description: "Transaksi hari ini",
			StartDate:   today,
			EndDate:     now,
		},
		{
			Key:         "this_week",
			Label:       "Minggu Ini",
			Description: "Transaksi minggu ini (Senin - Minggu)",
			StartDate:   thisWeekStart,
			EndDate:     now,
		},
		{
			Key:         "this_month",
			Label:       "Bulan Ini",
			Description: "Transaksi bulan ini",
			StartDate:   thisMonthStart,
			EndDate:     now,
		},
		{
			Key:         "this_quarter",
			Label:       "Kuartal Ini",
			Description: "Transaksi kuartal ini",
			StartDate:   thisQuarterStart,
			EndDate:     now,
		},
		{
			Key:         "this_year",
			Label:       "Tahun Ini",
			Description: "Transaksi tahun ini",
			StartDate:   thisYearStart,
			EndDate:     now,
		},
		{
			Key:         "last_7_days",
			Label:       "7 Hari Terakhir",
			Description: "Transaksi 7 hari terakhir",
			StartDate:   last7Days,
			EndDate:     now,
		},
		{
			Key:         "last_30_days",
			Label:       "30 Hari Terakhir",
			Description: "Transaksi 30 hari terakhir",
			StartDate:   last30Days,
			EndDate:     now,
		},
		{
			Key:         "last_90_days",
			Label:       "90 Hari Terakhir",
			Description: "Transaksi 90 hari terakhir",
			StartDate:   last90Days,
			EndDate:     now,
		},
	}

	return presets, nil
}

// GetPKSReportFilters returns available filter options for PKS reports
// @Summary Get PKS Report Filters
// @Description Returns available filter options (suppliers, products, grades, etc.)
// @Tags PKS Reporting
// @Produce json
// @Success 200 {object} service.ReportFilterOptions
// @Failure 500 {object} map[string]string
// @Router /api/pks/report/filters [get]
func (a *App) GetPKSReportFilters(ctx context.Context) (*service.ReportFilterOptions, error) {
	if a.application == nil || a.application.Container == nil || a.application.Container.PKSReportService == nil {
		return nil, fmt.Errorf("PKS report service not available")
	}

	filters, err := a.application.Container.PKSReportService.GetFilterOptions(ctx)
	if err != nil {
		runtime.LogErrorf(ctx, "Failed to get PKS report filters: %v", err)
		return nil, fmt.Errorf("failed to get filter options: %w", err)
	}

	return filters, nil
}

// ValidatePKSReportRequest validates report request parameters before processing
// @Summary Validate PKS Report Request
// @Description Validates report request parameters and returns validation results
// @Tags PKS Reporting
// @Accept json
// @Produce json
// @Param request body service.ReportRequest true "Report request parameters"
// @Success 200 {object} service.ValidationResult
// @Failure 400 {object} map[string]string
// @Router /api/pks/report/validate [post]
func (a *App) ValidatePKSReportRequest(ctx context.Context, req *service.ReportRequest) (*service.ValidationResult, error) {
	// Validate request
	validation := &service.ValidationResult{
		IsValid: true,
		Errors:  []string{},
		Warnings: []string{},
	}

	if req == nil {
		validation.IsValid = false
		validation.Errors = append(validation.Errors, "Request cannot be nil")
		return validation, nil
	}

	// Date validation
	if req.StartDate.IsZero() || req.EndDate.IsZero() {
		validation.IsValid = false
		validation.Errors = append(validation.Errors, "Start date and end date are required")
		return validation, nil
	}

	if req.EndDate.Before(req.StartDate) {
		validation.IsValid = false
		validation.Errors = append(validation.Errors, "End date must be after start date")
		return validation, nil
	}

	// Date range warnings
	maxDays := 365
	if req.EndDate.Sub(req.StartDate).Hours() > float64(maxDays*24) {
		validation.Warnings = append(validation.Warnings,
			fmt.Sprintf("Report period is very long (> %d days). Consider a shorter period for better performance.", maxDays))
	}

	// Check for future dates
	if req.EndDate.After(time.Now()) {
		validation.Warnings = append(validation.Warnings, "End date is in the future")
	}

	// Estimate record count and warn about large reports
	if a.application == nil || a.application.Container == nil || a.application.Container.PKSReportService == nil {
		validation.IsValid = false
		validation.Errors = append(validation.Errors, "PKS report service not available")
		return validation, nil
	}

	estimatedRecords, err := a.application.Container.PKSReportService.EstimateRecordCount(ctx, req.StartDate, req.EndDate)
	if err == nil && estimatedRecords > 10000 {
		validation.Warnings = append(validation.Warnings,
			fmt.Sprintf("Large dataset expected (~%d records). Export may take several minutes.", estimatedRecords))
	}

	return validation, nil
}