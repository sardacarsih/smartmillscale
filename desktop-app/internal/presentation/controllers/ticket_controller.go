package controllers

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
)

// TicketController handles ticket printing operations
type TicketController struct {
	ticketService *service.TicketService
}

// NewTicketController creates a new ticket controller
func NewTicketController(ticketService *service.TicketService) *TicketController {
	return &TicketController{
		ticketService: ticketService,
	}
}

// PrintTicket prints a ticket for a PKS transaction
func (c *TicketController) PrintTicket(requestJSON string) (string, error) {
	// Parse request
	var req struct {
		TimbanganID string `json:"timbanganId"`
		Copies      int    `json:"copies"`
		IsReprint   bool   `json:"isReprint"`
		OperatorID  string `json:"operatorId"`
	}

	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return "", fmt.Errorf("invalid request format: %w", err)
	}

	// Validate required fields
	if req.TimbanganID == "" {
		return "", fmt.Errorf("timbangan ID is required")
	}

	if req.Copies <= 0 {
		req.Copies = 1 // Default to 1 copy
	}

	// Parse UUIDs
	timbanganID, err := uuid.Parse(req.TimbanganID)
	if err != nil {
		return "", fmt.Errorf("invalid timbangan ID: %w", err)
	}

	operatorID, err := uuid.Parse(req.OperatorID)
	if err != nil {
		return "", fmt.Errorf("invalid operator ID: %w", err)
	}

	// Create print request
	printReq := &service.PrintRequest{
		TimbanganID: timbanganID,
		Copies:      req.Copies,
		IsReprint:   req.IsReprint,
		OperatorID:  operatorID,
	}

	// Print ticket
	result, err := c.ticketService.PrintTicket(context.Background(), printReq)
	if err != nil {
		return "", fmt.Errorf("failed to print ticket: %w", err)
	}

	// Convert to JSON
	responseJSON, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("failed to marshal response: %w", err)
	}

	return string(responseJSON), nil
}

// GetTicketHistory retrieves ticket printing history
func (c *TicketController) GetTicketHistory(limit int, offset int) (string, error) {
	if limit <= 0 {
		limit = 20 // Default limit
	}
	if offset < 0 {
		offset = 0 // Default offset
	}

	tickets, total, err := c.ticketService.GetTicketHistory(context.Background(), limit, offset)
	if err != nil {
		return "", fmt.Errorf("failed to get ticket history: %w", err)
	}

	// Create response
	response := map[string]interface{}{
		"data":  tickets,
		"total": total,
		"limit": limit,
		"page":  (offset / limit) + 1,
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return "", fmt.Errorf("failed to marshal response: %w", err)
	}

	return string(responseJSON), nil
}

// GetTicketByNumber retrieves a ticket by ticket number
func (c *TicketController) GetTicketByNumber(ticketNumber string) (string, error) {
	if ticketNumber == "" {
		return "", fmt.Errorf("ticket number is required")
	}

	ticket, err := c.ticketService.GetTicketByNumber(context.Background(), ticketNumber)
	if err != nil {
		return "", fmt.Errorf("failed to get ticket: %w", err)
	}

	// Convert to JSON
	responseJSON, err := json.Marshal(ticket)
	if err != nil {
		return "", fmt.Errorf("failed to marshal response: %w", err)
	}

	return string(responseJSON), nil
}

// GetPrintStatistics retrieves printing statistics
func (c *TicketController) GetPrintStatistics(days int) (string, error) {
	if days <= 0 {
		days = 30 // Default to 30 days
	}

	stats, err := c.ticketService.GetPrintStatistics(context.Background(), days)
	if err != nil {
		return "", fmt.Errorf("failed to get print statistics: %w", err)
	}

	// Convert to JSON
	responseJSON, err := json.Marshal(stats)
	if err != nil {
		return "", fmt.Errorf("failed to marshal response: %w", err)
	}

	return string(responseJSON), nil
}

// GenerateTicketPreview generates a preview of the ticket content
func (c *TicketController) GenerateTicketPreview(timbanganID string) (string, error) {
	if timbanganID == "" {
		return "", fmt.Errorf("timbangan ID is required")
	}

	// Parse UUID
	_, err := uuid.Parse(timbanganID)
	if err != nil {
		return "", fmt.Errorf("invalid timbangan ID: %w", err)
	}

	// For preview, we would need to get the transaction data and format it
	// This is a simplified version that just returns the ticket number format
	ticketNumber := c.ticketService.GenerateTicketNumber()

	response := map[string]interface{}{
		"ticketNumber": ticketNumber,
		"preview":      fmt.Sprintf("Preview format for ticket: %s", ticketNumber),
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return "", fmt.Errorf("failed to marshal response: %w", err)
	}

	return string(responseJSON), nil
}