package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
)

// TicketService handles ticket printing for PKS transactions
type TicketService struct {
	db *gorm.DB
}

// NewTicketService creates a new ticket service
func NewTicketService(db *gorm.DB) *TicketService {
	return &TicketService{db: db}
}

// TicketData represents the data needed for ticket printing
type TicketData struct {
	NoTransaksi    string    `json:"noTransaksi"`
	Tanggal        time.Time `json:"tanggal"`
	Perusahaan     string    `json:"perusahaan"`
	Alamat         string    `json:"alamat"`
	DriverName     string    `json:"driverName"`
	NomorPolisi    string    `json:"nomorPolisi"`
	Produk         string    `json:"produk"`
		Bruto1         float64   `json:"bruto1"`
	Tara1          float64   `json:"tara1"`
	Netto1         float64   `json:"netto1"`
	Bruto2         float64   `json:"bruto2"`
	Tara2          float64   `json:"tara2"`
	Netto2         float64   `json:"netto2"`
	SelisihNetto   float64   `json:"selisihNetto"`
	Officer1Name   string    `json:"officer1Name"`
	Officer2Name   string    `json:"officer2Name"`
	TicketNumber   string    `json:"ticketNumber"`
	PrintCount     int       `json:"printCount"`
}

// PrintRequest represents a ticket printing request
type PrintRequest struct {
	TimbanganID    uuid.UUID `json:"timbanganId"`
	Copies         int       `json:"copies"`
	IsReprint      bool      `json:"isReprint"`
	OperatorID     uuid.UUID `json:"operatorId"`
}

// PrintResponse represents the result of a print operation
type PrintResponse struct {
	Success        bool      `json:"success"`
	TicketNumber   string    `json:"ticketNumber"`
	PrintCount     int       `json:"printCount"`
	PrintedAt      time.Time `json:"printedAt"`
	ErrorMessage   string    `json:"errorMessage,omitempty"`
	TicketData     *TicketData `json:"ticketData,omitempty"`
}

// GenerateTicketNumber generates a unique ticket number
func (s *TicketService) GenerateTicketNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")

	// Count existing tickets for today
	var count int64
	s.db.WithContext(context.Background()).
		Model(&database.PKSTicket{}).
		Where("DATE(printed_at) = ?", now.Format("2006-01-02")).
		Count(&count)

	sequence := count + 1
	return fmt.Sprintf("TKT-%s-%04d", dateStr, sequence)
}

// CreateTicketData creates ticket data from a PKS transaction
func (s *TicketService) CreateTicketData(ctx context.Context, timbangan *database.TimbanganPKS) (*TicketData, error) {
	ticketNumber := s.GenerateTicketNumber()

	// Calculate selisih netto
	selisihNetto := timbangan.Netto2 - timbangan.Netto

	ticketData := &TicketData{
		NoTransaksi:   timbangan.NoTransaksi,
		Tanggal:       timbangan.Timbang1Date,
		Perusahaan:    "PT. KELAPA SAWIT MANDIRI", // Default company name
		Alamat:        "Jl. Industri No. 123, Jakarta", // Default address
		DriverName:    timbangan.DriverName,
		NomorPolisi:   timbangan.Unit.NomorPolisi,
		Produk:        timbangan.Produk.NamaProduk,
				Bruto1:        timbangan.Bruto,
		Tara1:         timbangan.Tara,
		Netto1:        timbangan.Netto,
		Bruto2:        timbangan.Bruto2,
		Tara2:         timbangan.Tara2,
		Netto2:        timbangan.Netto2,
		SelisihNetto:  selisihNetto,
		Officer1Name:  "Operator 1", // Would get from user service
		Officer2Name:  "Operator 2", // Would get from user service
		TicketNumber:  ticketNumber,
		PrintCount:    1,
	}

	return ticketData, nil
}

// PrintTicket prints a ticket for a PKS transaction
func (s *TicketService) PrintTicket(ctx context.Context, req *PrintRequest) (*PrintResponse, error) {
	// Get the transaction
	var timbangan database.TimbanganPKS
	if err := s.db.WithContext(ctx).
		Preload("Produk").
		Preload("Unit").
		Preload("Supplier").
		Preload("Officer1").
		Preload("Officer2").
		First(&timbangan, req.TimbanganID).Error; err != nil {
		return &PrintResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Transaksi tidak ditemukan: %v", err),
		}, nil
	}

	// Validate transaction status
	if timbangan.Status != "selesai" {
		return &PrintResponse{
			Success:      false,
			ErrorMessage: "Hanya transaksi yang sudah selesai yang bisa dicetak",
		}, nil
	}

	// Check if reprint and get existing ticket
	var existingTicket *database.PKSTicket
	if req.IsReprint {
		if err := s.db.WithContext(ctx).
			Where("timbangan_id = ?", req.TimbanganID).
			Order("printed_at DESC").
			First(&existingTicket).Error; err != nil {
			return &PrintResponse{
				Success:      false,
				ErrorMessage: "Tidak ada tiket yang bisa di-reprint",
			}, nil
		}
	}

	// Create ticket data
	ticketData, err := s.CreateTicketData(ctx, &timbangan)
	if err != nil {
		return &PrintResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Gagal membuat data tiket: %v", err),
		}, nil
	}

	// Update ticket data for reprint
	if existingTicket != nil {
		ticketData.TicketNumber = existingTicket.TicketNumber
		ticketData.PrintCount = existingTicket.ReprintCount + req.Copies
	}

	// Create database record
	now := time.Now()
	ticketRecord := &database.PKSTicket{
		NoTransaksi:   timbangan.NoTransaksi,
		TimbanganID:   req.TimbanganID,
		TicketNumber:  ticketData.TicketNumber,
		PrintedAt:     now,
		PrintedBy:     req.OperatorID,
		Copies:        req.Copies,
		ReprintCount:  ticketData.PrintCount - 1,
		LastReprintAt: &now,
		IsActive:      true,
	}

	if err := s.db.WithContext(ctx).Create(ticketRecord).Error; err != nil {
		return &PrintResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Gagal menyimpan record tiket: %v", err),
		}, nil
	}

	// Actually print the ticket (this would interface with printer hardware)
	printSuccess := s.printToHardware(ticketData, req.Copies)

	if !printSuccess {
		// Mark ticket as inactive if printing failed
		s.db.WithContext(ctx).Model(ticketRecord).Update("is_active", false)
		return &PrintResponse{
			Success:      false,
			ErrorMessage: "Gagal mencetak tiket ke printer",
		}, nil
	}

	return &PrintResponse{
		Success:      true,
		TicketNumber: ticketData.TicketNumber,
		PrintCount:   ticketData.PrintCount,
		PrintedAt:    now,
		TicketData:   ticketData,
	}, nil
}

// GetTicketHistory retrieves ticket printing history
func (s *TicketService) GetTicketHistory(ctx context.Context, limit int, offset int) ([]database.PKSTicket, int64, error) {
	var tickets []database.PKSTicket
	var total int64

	// Count total records
	if err := s.db.WithContext(ctx).
		Model(&database.PKSTicket{}).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get records with pagination
	query := s.db.WithContext(ctx).
		Preload("Timbangan").
		Preload("Timbangan.Produk").
		Preload("Timbangan.Unit").
		Order("printed_at DESC").
		Limit(limit).
		Offset(offset)

	if err := query.Find(&tickets).Error; err != nil {
		return nil, 0, err
	}

	return tickets, total, nil
}

// GetTicketByNumber retrieves a ticket by ticket number
func (s *TicketService) GetTicketByNumber(ctx context.Context, ticketNumber string) (*database.PKSTicket, error) {
	var ticket database.PKSTicket
	if err := s.db.WithContext(ctx).
		Preload("Timbangan").
		Preload("Timbangan.Produk").
		Preload("Timbangan.Unit").
		Preload("Timbangan.Supplier").
		Preload("Timbangan.Officer1").
		Preload("Timbangan.Officer2").
		Where("ticket_number = ?", ticketNumber).
		First(&ticket).Error; err != nil {
		return nil, err
	}

	return &ticket, nil
}

// PrintToHardware simulates printing to hardware (in real implementation, this would interface with actual printer)
func (s *TicketService) printToHardware(ticketData *TicketData, copies int) bool {
	log.Printf("Printing %d copies of ticket %s", copies, ticketData.TicketNumber)

	// In a real implementation, this would:
	// 1. Connect to printer (USB, network, etc.)
	// 2. Format ticket content for printer
	// 3. Send print commands
	// 4. Handle printer errors
	// 5. Return success/failure status

	// For now, simulate successful printing
	time.Sleep(1 * time.Second) // Simulate printing time
	log.Printf("Successfully printed ticket %s", ticketData.TicketNumber)

	return true
}

// FormatTicketForPrinter formats ticket data for printer output
func (s *TicketService) FormatTicketForPrinter(ticketData *TicketData) string {
	ticket := fmt.Sprintf(`
========================================
     TIKET TIMBANG PKS
========================================

No. Tiket: %s
Tanggal: %s

----------------------------------------
PT. KELAPA SAWIT MANDIRI
%s
----------------------------------------

DATA TRANSAKSI
----------------------------------------
No. Transaksi: %s
Supir: %s
Kendaraan: %s
Produk: %s

TIMBANG 1
----------------------------------------
Bruto: %.2f kg
Tara:  %.2f kg
Netto: %.2f kg
Petugas: %s

TIMBANG 2
----------------------------------------
Bruto: %.2f kg
Tara:  %.2f kg
Netto: %.2f kg
Petugas: %s

SELISIH NETTO: %.2f kg

----------------------------------------
Dicetak pada: %s
Copies: %d
========================================
`,
		ticketData.TicketNumber,
		ticketData.Tanggal.Format("02-01-2006 15:04:05"),
		ticketData.Alamat,
		ticketData.NoTransaksi,
		ticketData.DriverName,
		ticketData.NomorPolisi,
		ticketData.Produk,
				ticketData.Bruto1,
		ticketData.Tara1,
		ticketData.Netto1,
		ticketData.Officer1Name,
		ticketData.Bruto2,
		ticketData.Tara2,
		ticketData.Netto2,
		ticketData.Officer2Name,
		ticketData.SelisihNetto,
		time.Now().Format("02-01-2006 15:04:05"),
		ticketData.PrintCount,
	)

	return ticket
}

// GetPrintStatistics retrieves printing statistics
func (s *TicketService) GetPrintStatistics(ctx context.Context, days int) (map[string]interface{}, error) {
	startDate := time.Now().AddDate(0, 0, -days)

	var stats struct {
		TotalTickets    int64   `json:"totalTickets"`
		TotalReprints   int64   `json:"totalReprints"`
		TotalCopies     int64   `json:"totalCopies"`
		TodayTickets    int64   `json:"todayTickets"`
		TodayCopies     int64   `json:"todayCopies"`
	}

	// Get total statistics
	s.db.WithContext(ctx).
		Model(&database.PKSTicket{}).
		Where("printed_at >= ?", startDate).
		Select("COUNT(*) as totalTickets, COALESCE(SUM(reprint_count), 0) as totalReprints, COALESCE(SUM(copies), 0) as totalCopies").
		Scan(&stats)

	// Get today's statistics
	today := time.Now().Truncate(24 * time.Hour)
	s.db.WithContext(ctx).
		Model(&database.PKSTicket{}).
		Where("printed_at >= ?", today).
		Select("COUNT(*) as todayTickets, COALESCE(SUM(copies), 0) as todayCopies").
		Scan(&stats)

	result := map[string]interface{}{
		"totalTickets":  stats.TotalTickets,
		"totalReprints": stats.TotalReprints,
		"totalCopies":   stats.TotalCopies,
		"todayTickets":  stats.TodayTickets,
		"todayCopies":   stats.TodayCopies,
		"periodDays":    days,
	}

	return result, nil
}