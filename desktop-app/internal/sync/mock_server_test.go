package sync

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

func TestMockServerHealthCheck(t *testing.T) {
	// Create and start mock server
	server := NewMockSyncServer(8444, 1.0, 10*time.Millisecond)
	if err := server.Start(); err != nil {
		t.Fatalf("Failed to start mock server: %v", err)
	}
	defer server.Stop()

	// Give server time to start
	time.Sleep(100 * time.Millisecond)

	// Create health check request
	gqlRequest := GraphQLRequest{
		Query: `query { health { status } }`,
	}

	requestBody, _ := json.Marshal(gqlRequest)

	// Send health check request
	resp, err := http.Post("http://localhost:8444/graphql", "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		t.Fatalf("Failed to send health check: %v", err)
	}
	defer resp.Body.Close()

	// Parse response
	var gqlResponse GraphQLResponse
	if err := json.NewDecoder(resp.Body).Decode(&gqlResponse); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	// Verify response
	if gqlResponse.Errors != nil {
		t.Errorf("Health check returned errors: %+v", gqlResponse.Errors)
	}

	if gqlResponse.Data == nil {
		t.Fatal("Health check returned nil data")
	}

	t.Logf("Health check response: %+v", gqlResponse.Data)
}

func TestMockServerSingleSync(t *testing.T) {
	// Create and start mock server with 100% success rate for predictable testing
	server := NewMockSyncServer(8445, 1.0, 10*time.Millisecond)
	if err := server.Start(); err != nil {
		t.Fatalf("Failed to start mock server: %v", err)
	}
	defer server.Stop()

	// Give server time to start
	time.Sleep(100 * time.Millisecond)

	// Create test record
	testRecord := types.TimbanganData{
		IDLocal:        uuid.New(),
		NomorKendaraan: "B1234XYZ",
		BeratKotor:     5000,
		BeratBersih:    4500,
		Tanggal:        time.Now(),
		DeviceID:       "test-device",
	}

	// Create GraphQL mutation
	gqlRequest := GraphQLRequest{
		Query: `mutation SyncSingleRecord($input: TimbanganInput!) {
			syncSingleRecord(input: $input) {
				idLocal
				idPusat
				status
				error
			}
		}`,
		Variables: map[string]interface{}{
			"input": testRecord,
		},
	}

	requestBody, _ := json.Marshal(gqlRequest)

	// Send sync request
	resp, err := http.Post("http://localhost:8445/graphql", "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		t.Fatalf("Failed to send sync request: %v", err)
	}
	defer resp.Body.Close()

	// Parse response
	var gqlResponse GraphQLResponse
	if err := json.NewDecoder(resp.Body).Decode(&gqlResponse); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	// Verify response
	if gqlResponse.Errors != nil {
		t.Errorf("Sync returned errors: %+v", gqlResponse.Errors)
	}

	if gqlResponse.Data == nil {
		t.Fatal("Sync returned nil data")
	}

	// Check if record was synced
	dataMap := gqlResponse.Data.(map[string]interface{})
	syncResult := dataMap["syncSingleRecord"].(map[string]interface{})

	if syncResult["status"] != "SUCCESS" {
		t.Errorf("Expected SUCCESS status, got %v", syncResult["status"])
	}

	if syncResult["idPusat"] == nil {
		t.Error("Expected idPusat to be set, got nil")
	}

	// Verify server stored the record
	if _, exists := server.GetSyncedRecord(testRecord.IDLocal); !exists {
		t.Error("Server did not store the synced record")
	}

	t.Logf("Sync response: %+v", syncResult)
	t.Logf("Total synced records: %d", server.GetSyncedCount())
}

func TestMockServerBatchSync(t *testing.T) {
	// Create and start mock server
	server := NewMockSyncServer(8446, 0.8, 10*time.Millisecond)
	if err := server.Start(); err != nil {
		t.Fatalf("Failed to start mock server: %v", err)
	}
	defer server.Stop()

	// Give server time to start
	time.Sleep(100 * time.Millisecond)

	// Create test records
	records := []types.TimbanganData{
		{
			IDLocal:        uuid.New(),
			NomorKendaraan: "B1111AAA",
			BeratKotor:     5000,
			BeratBersih:    4500,
			Tanggal:        time.Now(),
			DeviceID:       "test-device",
		},
		{
			IDLocal:        uuid.New(),
			NomorKendaraan: "B2222BBB",
			BeratKotor:     6000,
			BeratBersih:    5500,
			Tanggal:        time.Now(),
			DeviceID:       "test-device",
		},
		{
			IDLocal:        uuid.New(),
			NomorKendaraan: "B3333CCC",
			BeratKotor:     4000,
			BeratBersih:    3500,
			Tanggal:        time.Now(),
			DeviceID:       "test-device",
		},
	}

	// Create GraphQL mutation
	gqlRequest := GraphQLRequest{
		Query: `mutation BatchSyncWeighingData($input: BatchSyncInput!) {
			batchSyncWeighingData(input: $input) {
				totalReceived
				successCount
				failedCount
				results {
					idLocal
					idPusat
					status
					error
				}
				serverTime
			}
		}`,
		Variables: map[string]interface{}{
			"input": map[string]interface{}{
				"deviceId": "test-device",
				"records":  records,
			},
		},
	}

	requestBody, _ := json.Marshal(gqlRequest)

	// Send batch sync request
	resp, err := http.Post("http://localhost:8446/graphql", "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		t.Fatalf("Failed to send batch sync request: %v", err)
	}
	defer resp.Body.Close()

	// Parse response
	var gqlResponse GraphQLResponse
	if err := json.NewDecoder(resp.Body).Decode(&gqlResponse); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	// Verify response
	if gqlResponse.Errors != nil {
		t.Errorf("Batch sync returned errors: %+v", gqlResponse.Errors)
	}

	if gqlResponse.Data == nil {
		t.Fatal("Batch sync returned nil data")
	}

	// Check response structure
	dataMap := gqlResponse.Data.(map[string]interface{})
	batchResult := dataMap["batchSyncWeighingData"].(map[string]interface{})

	totalReceived := int(batchResult["totalReceived"].(float64))
	if totalReceived != len(records) {
		t.Errorf("Expected totalReceived=%d, got %d", len(records), totalReceived)
	}

	successCount := int(batchResult["successCount"].(float64))
	failedCount := int(batchResult["failedCount"].(float64))

	if successCount+failedCount != totalReceived {
		t.Errorf("Success + Failed counts don't match total: %d + %d != %d",
			successCount, failedCount, totalReceived)
	}

	t.Logf("Batch sync results: Total=%d, Success=%d, Failed=%d",
		totalReceived, successCount, failedCount)
	t.Logf("Total synced records in server: %d", server.GetSyncedCount())
}

func TestMockServerFailureSimulation(t *testing.T) {
	// Create server with low success rate to test failures
	server := NewMockSyncServer(8447, 0.2, 10*time.Millisecond)
	if err := server.Start(); err != nil {
		t.Fatalf("Failed to start mock server: %v", err)
	}
	defer server.Stop()

	// Give server time to start
	time.Sleep(100 * time.Millisecond)

	// Try syncing multiple records to get some failures
	successCount := 0
	failureCount := 0

	for i := 0; i < 10; i++ {
		testRecord := types.TimbanganData{
			IDLocal:        uuid.New(),
			NomorKendaraan: "TEST" + string(rune(i)),
			BeratKotor:     5000,
			BeratBersih:    4500,
			Tanggal:        time.Now(),
			DeviceID:       "test-device",
		}

		gqlRequest := GraphQLRequest{
			Query: `mutation SyncSingleRecord($input: TimbanganInput!) {
				syncSingleRecord(input: $input) {
					idLocal
					idPusat
					status
					error
				}
			}`,
			Variables: map[string]interface{}{
				"input": testRecord,
			},
		}

		requestBody, _ := json.Marshal(gqlRequest)
		resp, err := http.Post("http://localhost:8447/graphql", "application/json", bytes.NewBuffer(requestBody))
		if err != nil {
			t.Fatalf("Failed to send sync request: %v", err)
		}

		var gqlResponse GraphQLResponse
		json.NewDecoder(resp.Body).Decode(&gqlResponse)
		resp.Body.Close()

		dataMap := gqlResponse.Data.(map[string]interface{})
		syncResult := dataMap["syncSingleRecord"].(map[string]interface{})

		if syncResult["status"] == "SUCCESS" {
			successCount++
		} else {
			failureCount++
		}
	}

	t.Logf("Sync attempts: Success=%d, Failed=%d (expected ~20%% success rate)",
		successCount, failureCount)

	// With 20% success rate and 10 attempts, we expect some failures
	if failureCount == 0 {
		t.Error("Expected some failures with 20% success rate, got none")
	}
}
