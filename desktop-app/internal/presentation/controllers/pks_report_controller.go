package controllers

import (
	"context"
	"fmt"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repository"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
)

// PKSReportController handles HTTP/Wails requests for PKS reporting
type PKSReportController struct {
	reportService *service.PKSReportService
	excelService  *service.ExcelExportService
}

// NewPKSReportController creates a new instance of PKS Report Controller
func NewPKSReportController(reportService *service.PKSReportService, excelService *service.ExcelExportService) *PKSReportController {
	return &PKSReportController{
		reportService: reportService,
		excelService:  excelService,
	}
}

// GenerateReport generates a comprehensive PKS report
func (c *PKSReportController) GenerateReport(ctx context.Context, req *service.ReportRequest) (*service.ReportData, error) {
	if req == nil {
		return nil, fmt.Errorf("request cannot be nil")
	}

	// Validate date range
	if req.StartDate.IsZero() || req.EndDate.IsZero() {
		return nil, fmt.Errorf("start date and end date are required")
	}

	if req.EndDate.Before(req.StartDate) {
		return nil, fmt.Errorf("end date must be after start date")
	}

	return c.reportService.GenerateReport(ctx, req)
}

// ExportReportCSV exports the report to CSV format
func (c *PKSReportController) ExportReportCSV(ctx context.Context, req *service.ReportRequest) (string, error) {
	if req == nil {
		return "", fmt.Errorf("request cannot be nil")
	}

	// Generate report data
	reportData, err := c.reportService.GenerateReport(ctx, req)
	if err != nil {
		return "", fmt.Errorf("failed to generate report: %w", err)
	}

	// Export to CSV
	csvData, err := c.reportService.ExportToCSV(reportData)
	if err != nil {
		return "", fmt.Errorf("failed to export to CSV: %w", err)
	}

	return csvData, nil
}

// ExportReportExcel exports the report to Excel format
func (c *PKSReportController) ExportReportExcel(ctx context.Context, req *service.ReportRequest) ([]byte, error) {
	if req == nil {
		return nil, fmt.Errorf("request cannot be nil")
	}

	// Generate report data
	reportData, err := c.reportService.GenerateReport(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to generate report: %w", err)
	}

	// Export to Excel
	excelBytes, err := c.excelService.GenerateReportExcel(reportData)
	if err != nil {
		return nil, fmt.Errorf("failed to export to Excel: %w", err)
	}

	return excelBytes, nil
}

// GetReportSummary generates only the summary section (for quick preview)
func (c *PKSReportController) GetReportSummary(ctx context.Context, req *service.ReportRequest) (*service.ReportSummary, error) {
	if req == nil {
		return nil, fmt.Errorf("request cannot be nil")
	}

	// Normalize date range
	dateRange := repository.DateRange{
		Start: req.StartDate.Truncate(24 * time.Hour),
		End:   req.EndDate.Add(24 * time.Hour).Add(-1 * time.Second),
	}

	// Convert filters
	repoFilters := repository.ReportFilters{
		SupplierIDs:  req.Filters.SupplierIDs,
		ProductIDs:   req.Filters.ProductIDs,
		StatusFilter: req.Filters.StatusFilter,
		GradeFilter:  req.Filters.GradeFilter,
	}

	return c.reportService.GenerateReportSummary(ctx, dateRange, repoFilters)
}
