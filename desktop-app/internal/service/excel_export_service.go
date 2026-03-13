package service

import (
	"fmt"
	"strconv"

	"github.com/xuri/excelize/v2"
)

// ExcelExportService handles Excel file generation for reports
type ExcelExportService struct{}

// NewExcelExportService creates a new instance of Excel Export Service
func NewExcelExportService() *ExcelExportService {
	return &ExcelExportService{}
}

// GenerateReportExcel creates a complete Excel workbook from report data
func (s *ExcelExportService) GenerateReportExcel(data *ReportData) ([]byte, error) {
	f := excelize.NewFile()

	// Create sheets
	summarySheet := "Ringkasan"
	detailSheet := "Detail Transaksi"
	trendSheet := "Analisis Tren"
	anomalySheet := "Anomali"

	// Rename default sheet
	f.SetSheetName("Sheet1", summarySheet)

	// Create other sheets
	f.NewSheet(detailSheet)
	f.NewSheet(trendSheet)
	f.NewSheet(anomalySheet)

	// Generate each sheet
	if err := s.createSummarySheet(f, summarySheet, data); err != nil {
		return nil, fmt.Errorf("failed to create summary sheet: %w", err)
	}

	if err := s.createDetailSheet(f, detailSheet, data); err != nil {
		return nil, fmt.Errorf("failed to create detail sheet: %w", err)
	}

	if err := s.createTrendSheet(f, trendSheet, data); err != nil {
		return nil, fmt.Errorf("failed to create trend sheet: %w", err)
	}

	if err := s.createAnomalySheet(f, anomalySheet, data); err != nil {
		return nil, fmt.Errorf("failed to create anomaly sheet: %w", err)
	}

	// Set active sheet
	summaryIndex, _ := f.GetSheetIndex(summarySheet)
	f.SetActiveSheet(summaryIndex)

	// Write to buffer
	buffer, err := f.WriteToBuffer()
	if err != nil {
		return nil, fmt.Errorf("failed to write Excel file: %w", err)
	}

	return buffer.Bytes(), nil
}

// ============================================================================
// SUMMARY SHEET
// ============================================================================

func (s *ExcelExportService) createSummarySheet(f *excelize.File, sheetName string, data *ReportData) error {
	// Define styles
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 16, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"3B82F6"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	sectionHeaderStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 14, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"1E40AF"}},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
	})

	labelStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 11},
		Alignment: &excelize.Alignment{Horizontal: "left"},
		Border: []excelize.Border{
			{Type: "left", Color: "CCCCCC", Style: 1},
			{Type: "top", Color: "CCCCCC", Style: 1},
			{Type: "bottom", Color: "CCCCCC", Style: 1},
			{Type: "right", Color: "CCCCCC", Style: 1},
		},
	})

	valueStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 11},
		Alignment: &excelize.Alignment{Horizontal: "right"},
		Border: []excelize.Border{
			{Type: "left", Color: "CCCCCC", Style: 1},
			{Type: "top", Color: "CCCCCC", Style: 1},
			{Type: "bottom", Color: "CCCCCC", Style: 1},
			{Type: "right", Color: "CCCCCC", Style: 1},
		},
		NumFmt: 3, // Number with comma separator
	})

	// Report header
	f.MergeCell(sheetName, "A1", "D1")
	f.SetCellValue(sheetName, "A1", "LAPORAN TIMBANGAN PKS")
	f.SetCellStyle(sheetName, "A1", "D1", headerStyle)
	f.SetRowHeight(sheetName, 1, 30)

	// Period info
	f.SetCellValue(sheetName, "A2", "Periode:")
	f.SetCellValue(sheetName, "B2", fmt.Sprintf("%s s/d %s",
		data.Metadata.PeriodStart.Format("02/01/2006"),
		data.Metadata.PeriodEnd.Format("02/01/2006")))

	f.SetCellValue(sheetName, "A3", "Dibuat:")
	f.SetCellValue(sheetName, "B3", data.Metadata.GeneratedAt.Format("02/01/2006 15:04:05"))

	// Main metrics section
	row := 5
	f.MergeCell(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row))
	f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), "RINGKASAN UTAMA")
	f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row), sectionHeaderStyle)
	f.SetRowHeight(sheetName, row, 25)

	row++
	metrics := [][]interface{}{
		{"Total Transaksi", data.Summary.TotalTransactions},
		{"Total Kendaraan", data.Summary.TotalVehicles},
		{"Total Berat Kotor (kg)", data.Summary.WeightSummary.TotalFirstWeight},
		{"Total Berat Tara (kg)", data.Summary.WeightSummary.TotalTareWeight},
		{"Total Berat Bersih (kg)", data.Summary.WeightSummary.TotalNetWeight},
		{"Rata-rata Berat (kg)", data.Summary.AverageWeight},
		{"Total Afkir", fmt.Sprintf("%d (%.2f%%)", data.Summary.TotalRejections.Count, data.Summary.TotalRejections.Percentage)},
	}

	for _, metric := range metrics {
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), metric[0])
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), metric[1])
		f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), labelStyle)
		f.SetCellStyle(sheetName, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), valueStyle)
		row++
	}

	// TBS Classification section
	row += 2
	f.MergeCell(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row))
	f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), "KLASIFIKASI TBS")
	f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row), sectionHeaderStyle)
	f.SetRowHeight(sheetName, row, 25)

	row++
	tableHeaders := []string{"Tipe TBS", "Jumlah", "Berat (kg)", "Persentase"}
	for i, header := range tableHeaders {
		col := string(rune('A' + i))
		f.SetCellValue(sheetName, fmt.Sprintf("%s%d", col, row), header)
		f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), labelStyle)
	}

	row++
	for tbsType, tbsData := range data.Summary.TBSByType {
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), tbsType)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), tbsData.Count)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), tbsData.TotalWeight)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), fmt.Sprintf("%.2f%%", tbsData.Percentage))

		f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row), valueStyle)
		row++
	}

	// Set column widths
	f.SetColWidth(sheetName, "A", "A", 30)
	f.SetColWidth(sheetName, "B", "D", 20)

	return nil
}

// ============================================================================
// DETAIL SHEET
// ============================================================================

func (s *ExcelExportService) createDetailSheet(f *excelize.File, sheetName string, data *ReportData) error {
	// Header style
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"3B82F6"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "FFFFFF", Style: 1},
			{Type: "top", Color: "FFFFFF", Style: 1},
			{Type: "bottom", Color: "FFFFFF", Style: 1},
			{Type: "right", Color: "FFFFFF", Style: 1},
		},
	})

	// Data style
	dataStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E0E0E0", Style: 1},
			{Type: "top", Color: "E0E0E0", Style: 1},
			{Type: "bottom", Color: "E0E0E0", Style: 1},
			{Type: "right", Color: "E0E0E0", Style: 1},
		},
	})

	// Rejection style (red)
	rejectionStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Color: "DC2626"},
		Alignment: &excelize.Alignment{Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E0E0E0", Style: 1},
			{Type: "top", Color: "E0E0E0", Style: 1},
			{Type: "bottom", Color: "E0E0E0", Style: 1},
			{Type: "right", Color: "E0E0E0", Style: 1},
		},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"FEE2E2"}},
	})

	// Headers
	headers := []string{
		"No Transaksi", "Tanggal", "Nomor Kendaraan", "Supplier", "Tipe TBS",
		"Produk", "Grade", "Bruto (kg)", "Bruto2 (kg)", "Netto (kg)", "Netto2 (kg)",
		"Status", "Petugas 1", "Petugas 2",
	}

	for i, header := range headers {
		col := string(rune('A' + i))
		f.SetCellValue(sheetName, fmt.Sprintf("%s1", col), header)
		f.SetCellStyle(sheetName, fmt.Sprintf("%s1", col), fmt.Sprintf("%s1", col), headerStyle)
	}
	f.SetRowHeight(sheetName, 1, 30)

	// Data rows
	for i, tx := range data.Transactions {
		row := i + 2

		// Determine status text
		statusText := tx.Status
		if tx.IsRejected {
			statusText = "AFKIR"
		}

		// Values
		values := []interface{}{
			tx.NoTransaksi,
			tx.Timbang1Date.Format("02/01/2006 15:04"),
			tx.NomorKendaraan,
			tx.SupplierName,
			tx.SupplierType,
			tx.ProductName,
			tx.Grade,
			tx.Bruto,
			s.formatOptionalFloat(tx.Bruto2),
			tx.Netto,
			s.formatOptionalFloat(tx.Netto2),
			statusText,
			tx.Officer1Name,
			tx.Officer2Name,
		}

		for j, val := range values {
			col := string(rune('A' + j))
			f.SetCellValue(sheetName, fmt.Sprintf("%s%d", col, row), val)

			// Apply rejection style if applicable
			if tx.IsRejected {
				f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), rejectionStyle)
			} else {
				f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), dataStyle)
			}
		}
	}

	// Set column widths
	colWidths := map[string]float64{
		"A": 18, "B": 16, "C": 15, "D": 20, "E": 12,
		"F": 15, "G": 8,  "H": 12, "I": 12, "J": 12,
		"K": 12, "L": 12, "M": 15, "N": 15,
	}
	for col, width := range colWidths {
		f.SetColWidth(sheetName, col, col, width)
	}

	// Freeze first row
	f.SetPanes(sheetName, &excelize.Panes{
		Freeze:      true,
		XSplit:      0,
		YSplit:      1,
		TopLeftCell: "A2",
		ActivePane:  "bottomLeft",
	})

	return nil
}

// ============================================================================
// TREND SHEET
// ============================================================================

func (s *ExcelExportService) createTrendSheet(f *excelize.File, sheetName string, data *ReportData) error {
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"3B82F6"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	dataStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E0E0E0", Style: 1},
			{Type: "top", Color: "E0E0E0", Style: 1},
			{Type: "bottom", Color: "E0E0E0", Style: 1},
			{Type: "right", Color: "E0E0E0", Style: 1},
		},
	})

	row := 1

	// Daily Trends
	f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), "TREN HARIAN")
	f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row), headerStyle)
	row++

	headers := []string{"Tanggal", "Total Berat (kg)", "Jumlah Transaksi", "Rata-rata (kg)"}
	for i, h := range headers {
		col := string(rune('A' + i))
		f.SetCellValue(sheetName, fmt.Sprintf("%s%d", col, row), h)
		f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), headerStyle)
	}
	row++

	for _, trend := range data.Trends.DailyTrends {
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), trend.Date)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), trend.TotalWeight)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), trend.TransCount)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), trend.AvgWeight)

		for i := 0; i < 4; i++ {
			col := string(rune('A' + i))
			f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), dataStyle)
		}
		row++
	}

	// Grade Distribution
	row += 2
	f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), "DISTRIBUSI GRADE")
	f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("D%d", row), headerStyle)
	row++

	headers = []string{"Grade", "Jumlah", "Berat (kg)", "Persentase"}
	for i, h := range headers {
		col := string(rune('A' + i))
		f.SetCellValue(sheetName, fmt.Sprintf("%s%d", col, row), h)
		f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), headerStyle)
	}
	row++

	for _, grade := range data.Trends.GradeDistribution {
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), grade.Grade)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), grade.Count)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), grade.Weight)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), fmt.Sprintf("%.2f%%", grade.Percentage))

		for i := 0; i < 4; i++ {
			col := string(rune('A' + i))
			f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), dataStyle)
		}
		row++
	}

	// Set column widths
	f.SetColWidth(sheetName, "A", "D", 20)

	return nil
}

// ============================================================================
// ANOMALY SHEET
// ============================================================================

func (s *ExcelExportService) createAnomalySheet(f *excelize.File, sheetName string, data *ReportData) error {
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"EF4444"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	dataStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E0E0E0", Style: 1},
			{Type: "top", Color: "E0E0E0", Style: 1},
			{Type: "bottom", Color: "E0E0E0", Style: 1},
			{Type: "right", Color: "E0E0E0", Style: 1},
		},
	})

	row := 1

	// Summary
	f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), "RINGKASAN ANOMALI")
	f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("B%d", row), headerStyle)
	row++

	anomalySummary := [][]interface{}{
		{"Total Outlier Berat", data.Anomalies.Summary.TotalOutliers},
		{"Total Transaksi Tidak Lengkap", data.Anomalies.Summary.TotalIncomplete},
		{"Total Kendaraan Duplikat", data.Anomalies.Summary.TotalDuplicates},
		{"Total Missing Timbang2", data.Anomalies.Summary.TotalMissingSecond},
	}

	for _, item := range anomalySummary {
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), item[0])
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), item[1])
		f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("B%d", row), dataStyle)
		row++
	}

	// Incomplete Transactions
	if len(data.Anomalies.IncompleteTransactions) > 0 {
		row += 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), "TRANSAKSI TIDAK LENGKAP")
		f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("E%d", row), headerStyle)
		row++

		headers := []string{"No Transaksi", "Nomor Kendaraan", "Status", "Umur (jam)", "Alasan"}
		for i, h := range headers {
			col := string(rune('A' + i))
			f.SetCellValue(sheetName, fmt.Sprintf("%s%d", col, row), h)
			f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), headerStyle)
		}
		row++

		for _, incomplete := range data.Anomalies.IncompleteTransactions {
			f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), incomplete.Transaction.NoTransaksi)
			f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), incomplete.Transaction.NomorKendaraan)
			f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), incomplete.Stage)
			f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), fmt.Sprintf("%.1f", incomplete.AgeHours))
			f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), incomplete.Reason)

			for i := 0; i < 5; i++ {
				col := string(rune('A' + i))
				f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), dataStyle)
			}
			row++
		}
	}

	// Duplicate Vehicles
	if len(data.Anomalies.DuplicateVehicles) > 0 {
		row += 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), "KENDARAAN DUPLIKAT")
		f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("C%d", row), headerStyle)
		row++

		headers := []string{"Nomor Kendaraan", "Jumlah", "No Transaksi"}
		for i, h := range headers {
			col := string(rune('A' + i))
			f.SetCellValue(sheetName, fmt.Sprintf("%s%d", col, row), h)
			f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), headerStyle)
		}
		row++

		for _, dup := range data.Anomalies.DuplicateVehicles {
			f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), dup.VehicleNumber)
			f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), dup.Count)
			f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), fmt.Sprintf("%v", dup.TransactionIDs))

			for i := 0; i < 3; i++ {
				col := string(rune('A' + i))
				f.SetCellStyle(sheetName, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), dataStyle)
			}
			row++
		}
	}

	// Set column widths
	f.SetColWidth(sheetName, "A", "A", 30)
	f.SetColWidth(sheetName, "B", "E", 20)

	return nil
}

// ============================================================================
// HELPER METHODS
// ============================================================================

func (s *ExcelExportService) formatOptionalFloat(val *float64) interface{} {
	if val == nil {
		return "-"
	}
	return *val
}

func (s *ExcelExportService) formatOptionalString(val *string) string {
	if val == nil || *val == "" {
		return "-"
	}
	return *val
}

// NumberToExcelColumn converts a number to Excel column letter(s)
func NumberToExcelColumn(n int) string {
	result := ""
	for n > 0 {
		n--
		result = string(rune('A'+(n%26))) + result
		n /= 26
	}
	return result
}

// FormatPercentage formats a float as a percentage string
func FormatPercentage(val float64) string {
	return strconv.FormatFloat(val, 'f', 2, 64) + "%"
}
