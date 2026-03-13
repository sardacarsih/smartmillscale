package sync

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

// MockSyncServer simulates a remote GraphQL sync server for testing
type MockSyncServer struct {
	port          int
	successRate   float64       // 0.0 to 1.0 (e.g., 0.85 = 85% success rate)
	latency       time.Duration // Simulated network latency
	httpServer    *http.Server
	syncedRecords map[uuid.UUID]uuid.UUID // idLocal -> idPusat mapping
	mu            sync.RWMutex
}

// NewMockSyncServer creates a new mock sync server
func NewMockSyncServer(port int, successRate float64, latency time.Duration) *MockSyncServer {
	return &MockSyncServer{
		port:          port,
		successRate:   successRate,
		latency:       latency,
		syncedRecords: make(map[uuid.UUID]uuid.UUID),
	}
}

// Start starts the mock GraphQL server
func (s *MockSyncServer) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/graphql", s.handleGraphQL)

	// Create self-signed TLS config for development
	// Note: In production, use proper certificates
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS13,
		CipherSuites: []uint16{
			tls.TLS_AES_128_GCM_SHA256,
			tls.TLS_AES_256_GCM_SHA384,
			tls.TLS_CHACHA20_POLY1305_SHA256,
		},
		// For development, we'll allow insecure connections
		// Real implementation should use proper certificates
		InsecureSkipVerify: true,
	}

	s.httpServer = &http.Server{
		Addr:      fmt.Sprintf(":%d", s.port),
		Handler:   mux,
		TLSConfig: tlsConfig,
		// Timeouts
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Printf("Mock GraphQL server starting on port %d (success rate: %.0f%%, latency: %v)",
		s.port, s.successRate*100, s.latency)

	// For simplicity, we'll use HTTP instead of HTTPS in mock mode
	// Real server would use ListenAndServeTLS
	go func() {
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Mock server error: %v", err)
		}
	}()

	return nil
}

// Stop gracefully stops the mock server
func (s *MockSyncServer) Stop() error {
	if s.httpServer != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return s.httpServer.Shutdown(ctx)
	}
	return nil
}

// handleGraphQL handles incoming GraphQL requests
func (s *MockSyncServer) handleGraphQL(w http.ResponseWriter, r *http.Request) {
	// Simulate network latency
	time.Sleep(s.latency)

	// Only accept POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		s.sendError(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Parse GraphQL request
	var gqlRequest GraphQLRequest
	if err := json.Unmarshal(body, &gqlRequest); err != nil {
		s.sendError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Route based on query type
	var response GraphQLResponse

	if strings.Contains(gqlRequest.Query, "batchSyncWeighingData") {
		response = s.handleBatchSync(gqlRequest)
	} else if strings.Contains(gqlRequest.Query, "syncSingleRecord") {
		response = s.handleSingleSync(gqlRequest)
	} else if strings.Contains(gqlRequest.Query, "health") {
		response = s.handleHealthCheck()
	} else {
		s.sendError(w, "Unknown GraphQL operation", http.StatusBadRequest)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// handleBatchSync handles batch sync mutations
func (s *MockSyncServer) handleBatchSync(req GraphQLRequest) GraphQLResponse {
	// Extract records from variables
	input, ok := req.Variables["input"].(map[string]interface{})
	if !ok {
		return s.errorResponse("Invalid input structure")
	}

	recordsData, ok := input["records"].([]interface{})
	if !ok {
		return s.errorResponse("Invalid records structure")
	}

	// Process each record
	results := make([]types.SyncResult, len(recordsData))
	successCount := 0
	failedCount := 0

	for i, recordData := range recordsData {
		// Convert to JSON and back to parse properly
		recordJSON, _ := json.Marshal(recordData)
		var record types.TimbanganData
		json.Unmarshal(recordJSON, &record)

		// Simulate success/failure based on success rate
		success := rand.Float64() < s.successRate

		if success {
			// Generate idPusat for successful sync
			idPusat := uuid.New()

			// Store mapping
			s.mu.Lock()
			s.syncedRecords[record.IDLocal] = idPusat
			s.mu.Unlock()

			results[i] = types.SyncResult{
				IDLocal: record.IDLocal,
				IDPusat: &idPusat,
				Status:  "SUCCESS",
			}
			successCount++
		} else {
			// Simulate failure
			errorMsg := "Simulated sync failure"
			results[i] = types.SyncResult{
				IDLocal: record.IDLocal,
				IDPusat: nil,
				Status:  "FAILED",
				Error:   &errorMsg,
			}
			failedCount++
		}
	}

	// Build response
	syncResponse := types.SyncResponse{
		TotalReceived: len(recordsData),
		SuccessCount:  successCount,
		FailedCount:   failedCount,
		Results:       results,
		ServerTime:    time.Now(),
	}

	return GraphQLResponse{
		Data: map[string]interface{}{
			"batchSyncWeighingData": syncResponse,
		},
	}
}

// handleSingleSync handles single record sync mutations
func (s *MockSyncServer) handleSingleSync(req GraphQLRequest) GraphQLResponse {
	// Extract record from variables
	input, ok := req.Variables["input"].(map[string]interface{})
	if !ok {
		return s.errorResponse("Invalid input structure")
	}

	// Convert to TimbanganData
	recordJSON, _ := json.Marshal(input)
	var record types.TimbanganData
	if err := json.Unmarshal(recordJSON, &record); err != nil {
		return s.errorResponse("Failed to parse record")
	}

	// Simulate success/failure
	success := rand.Float64() < s.successRate

	var result types.SyncResult

	if success {
		// Generate idPusat
		idPusat := uuid.New()

		// Store mapping
		s.mu.Lock()
		s.syncedRecords[record.IDLocal] = idPusat
		s.mu.Unlock()

		result = types.SyncResult{
			IDLocal: record.IDLocal,
			IDPusat: &idPusat,
			Status:  "SUCCESS",
		}
	} else {
		errorMsg := "Simulated sync failure"
		result = types.SyncResult{
			IDLocal: record.IDLocal,
			IDPusat: nil,
			Status:  "FAILED",
			Error:   &errorMsg,
		}
	}

	return GraphQLResponse{
		Data: map[string]interface{}{
			"syncSingleRecord": result,
		},
	}
}

// handleHealthCheck handles health check queries
func (s *MockSyncServer) handleHealthCheck() GraphQLResponse {
	return GraphQLResponse{
		Data: map[string]interface{}{
			"health": map[string]string{
				"status": "OK",
			},
		},
	}
}

// errorResponse creates an error response
func (s *MockSyncServer) errorResponse(message string) GraphQLResponse {
	return GraphQLResponse{
		Errors: []GraphQLError{
			{
				Message: message,
			},
		},
	}
}

// sendError sends an HTTP error response
func (s *MockSyncServer) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(GraphQLResponse{
		Errors: []GraphQLError{
			{
				Message: message,
			},
		},
	})
}

// GetSyncedRecord retrieves the idPusat for a given idLocal (for testing)
func (s *MockSyncServer) GetSyncedRecord(idLocal uuid.UUID) (uuid.UUID, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	idPusat, exists := s.syncedRecords[idLocal]
	return idPusat, exists
}

// GetSyncedCount returns the number of successfully synced records (for testing)
func (s *MockSyncServer) GetSyncedCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.syncedRecords)
}
