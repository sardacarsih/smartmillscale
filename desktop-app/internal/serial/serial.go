package serial

import (
	"bufio"
	"bytes"
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/tarm/serial"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

// WeightData represents data read from the weighing scale
type WeightData struct {
	Weight    int       // Weight in kg or configured unit
	Unit      string    // Unit (kg, ton, etc.)
	Stable    bool      // Whether the reading is stable
	Timestamp time.Time // When the reading was captured
}

// SerialReader handles serial port communication with weighing scale
type SerialReader struct {
	port          *serial.Port
	config        types.WeighingConfig
	buffer        *bytes.Buffer
	mu            sync.Mutex
	connected     bool
	reconnecting  bool
	stopChan      chan struct{}
	dataChan      chan WeightData
	errorChan     chan error
	reconnectChan chan struct{} // Notifies subscribers of reconnection events
	wg            sync.WaitGroup // WaitGroup to ensure goroutines exit cleanly on Stop

	// Stability detection fields
	readingsBuffer   []int        // Buffer untuk menyimpan 10 pembacaan terakhir
	bufferMu         sync.RWMutex // Mutex untuk thread-safe buffer operations
	lastStableStatus bool         // Status stabilitas terakhir

	// Windows diagnostics
	diagnostics *WindowsSerialDiagnostics
	elevation   *WindowsElevation
}

// NewSerialReader creates a new serial port reader
func NewSerialReader(config types.WeighingConfig) *SerialReader {
	return &SerialReader{
		config:           config,
		buffer:           new(bytes.Buffer),
		connected:        false,
		stopChan:         make(chan struct{}),
		dataChan:         make(chan WeightData, 10),
		errorChan:        make(chan error, 10),
		reconnectChan:    make(chan struct{}, 10), // Buffered to prevent blocking
		readingsBuffer:   make([]int, 0, 10),      // Initialize dengan capacity 10
		lastStableStatus: false,                   // Default: tidak stabil
		diagnostics:      NewWindowsSerialDiagnostics(),
		elevation:        NewWindowsElevation(),
	}
}

// Connect establishes connection to the serial port
func (r *SerialReader) Connect() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.connected {
		return nil
	}

	log.Printf("Connecting to serial port %s...", r.config.COMPort)

	// Pre-connection diagnostics
	portInfo := r.diagnostics.GetPortInfo(r.config.COMPort)
	if !portInfo.Exists {
		log.Printf("Port %s not found in system registry", r.config.COMPort)
	}

	if portInfo.IsVirtual {
		log.Printf("Port %s appears to be a virtual COM port", r.config.COMPort)
	}

	// Check elevation status and handle if needed
	elevationStatus := r.elevation.GetElevationStatus(r.config.COMPort, r.diagnostics)
	log.Printf("Elevation status for %s - Admin: %t, Required: %t, Elevated Restart: %t",
		r.config.COMPort, elevationStatus.IsAdmin, elevationStatus.RequiresElevation, elevationStatus.IsElevatedRestart)

	// Log elevation suggestions if needed
	if elevationStatus.RequiresElevation && !elevationStatus.IsAdmin {
		log.Println("Elevation suggestions:")
		for i, suggestion := range elevationStatus.Suggestions {
			log.Printf("  %d. %s", i+1, suggestion)
		}
	}

	// Configure serial port
	cfg := &serial.Config{
		Name:        r.config.COMPort,
		Baud:        r.config.BaudRate,
		Size:        byte(r.config.DataBits),
		StopBits:    serial.StopBits(r.config.StopBits),
		ReadTimeout: time.Duration(r.config.ReadTimeout) * time.Millisecond,
	}

	// Set parity
	cfg.Parity = getParityConfig(r.config.Parity)

	// Open port
	port, err := serial.OpenPort(cfg)
	if err != nil {
		// Enhanced error handling with Windows diagnostics
		errorInfo := r.diagnostics.ClassifyError(err, r.config.COMPort)
		if errorInfo != nil {
			log.Printf("Enhanced error analysis for %s:", r.config.COMPort)
			log.Printf("  Error Type: %v", errorInfo.ErrorCode)
			log.Printf("  User Message: %s", errorInfo.UserMessage)
			log.Printf("  Requires Admin: %t", errorInfo.RequiresAdmin)
			log.Printf("  Recoverable: %t", errorInfo.Recoverable)
			if errorInfo.IsVirtual {
				log.Printf("  Virtual COM Port: Yes")
			}

			// Log suggestions
			for i, suggestion := range errorInfo.Suggestions {
				log.Printf("  Suggestion %d: %s", i+1, suggestion)
			}

			// Send detailed error information to error channel
			go func() {
				select {
				case r.errorChan <- fmt.Errorf("%s - %s", errorInfo.UserMessage, errorInfo.TechnicalInfo):
				default:
					// Channel full, skip
				}
			}()

			return fmt.Errorf("%s: %w", errorInfo.UserMessage, err)
		}
		return fmt.Errorf("failed to open serial port: %w", err)
	}

	r.port = port
	r.connected = true
	log.Printf("Successfully connected to %s", r.config.COMPort)

	// Log successful connection details
	if portInfo.FriendlyName != "" {
		log.Printf("Device friendly name: %s", portInfo.FriendlyName)
	}
	if portInfo.IsVirtual {
		log.Printf("Connected to virtual COM port successfully")
	}

	return nil
}

// Disconnect closes the serial port connection
func (r *SerialReader) Disconnect() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !r.connected || r.port == nil {
		return nil
	}

	log.Printf("Disconnecting from serial port %s...", r.config.COMPort)

	// Close the port with error handling
	if err := r.port.Close(); err != nil {
		// Log the error but continue with cleanup
		log.Printf("Warning: error closing serial port: %v", err)
	}

	// Always reset state regardless of close error
	r.port = nil
	r.connected = false
	r.buffer.Reset()

	log.Println("Serial port disconnected")
	return nil
}

// IsConnected returns the connection status
func (r *SerialReader) IsConnected() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.connected
}

// Start begins reading from the serial port
func (r *SerialReader) Start() error {
	if err := r.Connect(); err != nil {
		return err
	}

	r.wg.Add(2)
	go func() {
		defer r.wg.Done()
		r.readLoop()
	}()
	go func() {
		defer r.wg.Done()
		r.monitorConnection()
	}()

	log.Println("Serial reader started")
	return nil
}

// Stop stops reading and closes the serial port
func (r *SerialReader) Stop() error {
	close(r.stopChan)
	r.wg.Wait() // Wait for goroutines to finish before disconnecting
	return r.Disconnect()
}

// GetDataChannel returns the channel for receiving weight data
func (r *SerialReader) GetDataChannel() <-chan WeightData {
	return r.dataChan
}

// GetErrorChannel returns the channel for receiving errors
func (r *SerialReader) GetErrorChannel() <-chan error {
	return r.errorChan
}

// GetReconnectChannel returns the channel for reconnection notifications
func (r *SerialReader) GetReconnectChannel() <-chan struct{} {
	return r.reconnectChan
}

// readLoop continuously reads data from the serial port
func (r *SerialReader) readLoop() {
	var scanner *bufio.Scanner

	for {
		select {
		case <-r.stopChan:
			return
		default:
			// Check connection status and create new scanner if needed
			if !r.IsConnected() {
				scanner = nil // Clear scanner reference
				time.Sleep(1 * time.Second)
				continue
			}

			// Create new scanner if we don't have one or after reconnection
			if scanner == nil {
				r.mu.Lock()
				if r.port != nil {
					scanner = bufio.NewScanner(r.port)
				}
				r.mu.Unlock()

				if scanner == nil {
					time.Sleep(1 * time.Second)
					continue
				}
			}

			// Read line from serial port
			if scanner.Scan() {
				line := scanner.Text()
				if data, err := r.parseLine(line); err == nil {
					select {
					case r.dataChan <- data:
					default:
						// Channel full, skip this reading
					}
				}
			} else {
				// Check for scanner errors
				if err := scanner.Err(); err != nil {
					r.errorChan <- fmt.Errorf("scanner error: %w", err)
					// Clear scanner to force recreation on next iteration
					scanner = nil
					// Try to reconnect
					r.reconnect()
				} else {
					// No error but scan failed - likely EOF or connection lost
					log.Println("Scanner reached end of input, connection may be lost")
					scanner = nil
					r.reconnect()
				}
			}
		}
	}
}

// checkStability memeriksa apakah pembacaan berat sudah stabil
// Mengembalikan true jika 10 pembacaan terakhir memiliki selisih <= 0.5 kg (50 dalam centesimal)
func (r *SerialReader) checkStability(weight int) bool {
	r.bufferMu.Lock()
	defer r.bufferMu.Unlock()

	// Tambahkan weight baru ke buffer
	r.readingsBuffer = append(r.readingsBuffer, weight)

	// Jaga buffer tetap maksimal 10 items (FIFO)
	if len(r.readingsBuffer) > 10 {
		r.readingsBuffer = r.readingsBuffer[1:]
	}

	// Jika belum ada 10 pembacaan, return false
	if len(r.readingsBuffer) < 10 {
		log.Printf("Stability check: waiting for more readings (%d/10)", len(r.readingsBuffer))
		return false
	}

	// Hitung min dan max dari 10 pembacaan
	minWeight := r.readingsBuffer[0]
	maxWeight := r.readingsBuffer[0]

	for _, w := range r.readingsBuffer {
		if w < minWeight {
			minWeight = w
		}
		if w > maxWeight {
			maxWeight = w
		}
	}

	// Hitung selisih (range)
	difference := maxWeight - minWeight

	// Threshold: 50 centesimal = 0.5 kg
	const stabilityThreshold = 50
	isStable := difference <= stabilityThreshold

	// Log jika status berubah
	if isStable != r.lastStableStatus {
		if isStable {
			log.Printf("Weight STABLE: 10 readings within ±0.5 kg (range: %.2f kg)", float64(difference)/100)
		} else {
			log.Printf("Weight UNSTABLE: range %.2f kg exceeds ±0.5 kg threshold", float64(difference)/100)
		}
		r.lastStableStatus = isStable
	}

	return isStable
}

// parseLine parses a line of data from the weighing scale
// Format can vary by manufacturer - this is a generic implementation
// Customize based on your weighing scale protocol
func (r *SerialReader) parseLine(line string) (WeightData, error) {
	line = strings.TrimSpace(line)
	if line == "" {
		return WeightData{}, fmt.Errorf("empty line")
	}

	// Try different parsing formats based on scale output

	// Format 1: Simple format like "1210 kg" (user's scale format)
	if strings.Contains(line, " ") && !strings.Contains(line, ",") {
		return r.parseSimpleFormat(line)
	}

	// Format 2: Original comma-separated format like "ST,GS,+00123.4kg"
	if strings.Contains(line, ",") {
		return r.parseCommaFormat(line)
	}

	// Format 3: Just a number like "1210"
	if r.isNumeric(line) {
		return r.parseNumericFormat(line)
	}

	// If no format matches, return error
	return WeightData{}, fmt.Errorf("unrecognized data format: %s", line)
}

// parseSimpleFormat parses simple format like "1210 kg"
func (r *SerialReader) parseSimpleFormat(line string) (WeightData, error) {
	// Clean the line by removing control characters and extra whitespace
	// Remove common control characters (STX, ETX, ACK, etc.)
	cleanLine := strings.Map(func(r rune) rune {
		if r < 32 || r > 126 { // Remove non-printable ASCII characters
			return -1
		}
		return r
	}, line)

	// Trim whitespace
	cleanLine = strings.TrimSpace(cleanLine)

	parts := strings.Fields(cleanLine) // Split by whitespace
	if len(parts) < 2 {
		return WeightData{}, fmt.Errorf("invalid simple format: %s -> cleaned: %s", line, cleanLine)
	}

	// Find the weight number (could be first part or somewhere in the middle)
	var weightStr string
	var unit string

	// Look for a numeric part
	for i, part := range parts {
		// Try to parse as float to check if it's a number
		if _, err := strconv.ParseFloat(part, 64); err == nil {
			weightStr = part
			// Unit is likely the next part or the last part
			if i+1 < len(parts) {
				unit = parts[i+1]
			} else {
				unit = parts[len(parts)-1]
			}
			break
		}
	}

	if weightStr == "" {
		return WeightData{}, fmt.Errorf("no numeric weight found in: %s", cleanLine)
	}

	// Parse weight as float to handle decimals
	weight, err := strconv.ParseFloat(weightStr, 64)
	if err != nil {
		return WeightData{}, fmt.Errorf("failed to parse weight '%s': %v", weightStr, err)
	}

	// Allow zero weight - this is valid for empty scale
	if weight < 0 {
		return WeightData{}, fmt.Errorf("negative weight value: %s", weightStr)
	}

	// Zero weight is valid for empty scale

	// For Indonesian format display, we want to store as integer but display as 1.200 kg
	// If weight is whole number (like 1200), store as 120000 to display as 1.200,00 kg
	// If weight has decimals, store appropriately
	var weightInt int
	if weight == float64(int(weight)) {
		// Whole number: 1200 -> 120000 (for display as 1.200,00 kg)
		weightInt = int(weight * 100)
	} else {
		// Decimal number: 1234.56 -> 123456
		weightInt = int(weight * 100)
	}

	// Add validation range for safety
	if weight > 100000 { // Max 1000 kg for safety
		return WeightData{}, fmt.Errorf("weight out of range: %.2f", weight)
	}

	// Check stability berdasarkan konsistensi 10 pembacaan terakhir
	isStable := r.checkStability(weightInt)

	return WeightData{
		Weight:    weightInt,
		Unit:      unit,
		Stable:    isStable, // Actual stability based on 10 readings consistency
		Timestamp: time.Now(),
	}, nil
}

// parseCommaFormat parses original comma-separated format like "ST,GS,+00123.4kg"
func (r *SerialReader) parseCommaFormat(line string) (WeightData, error) {

	parts := strings.Split(line, ",")
	if len(parts) < 3 {
		return WeightData{}, fmt.Errorf("invalid comma format: %s", line)
	}

	// Parse stability
	stable := parts[0] == "ST"

	// Parse weight and unit
	weightStr := parts[2]

	// Extract numeric value and unit
	var weight float64
	var unit string

	// Remove leading zeros and plus sign
	weightStr = strings.TrimLeft(weightStr, "+0")

	// Separate number from unit
	for i, ch := range weightStr {
		if (ch < '0' || ch > '9') && ch != '.' && ch != '-' {
			if i > 0 {
				weight, _ = strconv.ParseFloat(weightStr[:i], 64)
				unit = weightStr[i:]
			}
			break
		}
	}

	if weight == 0 {
		return WeightData{}, fmt.Errorf("invalid weight value in comma format")
	}

	// Convert to integer (multiply by 100 to preserve 2 decimal places)
	weightInt := int(weight * 100)

	return WeightData{
		Weight:    weightInt,
		Unit:      unit,
		Stable:    stable,
		Timestamp: time.Now(),
	}, nil
}

// parseNumericFormat parses just a number like "1210"
func (r *SerialReader) parseNumericFormat(line string) (WeightData, error) {

	weight, err := strconv.ParseFloat(line, 64)
	if err != nil {
		return WeightData{}, fmt.Errorf("failed to parse numeric weight '%s': %v", line, err)
	}

	if weight == 0 {
		return WeightData{}, fmt.Errorf("invalid numeric weight value: %s", line)
	}

	// Convert to integer (multiply by 100 to preserve 2 decimal places)
	weightInt := int(weight * 100)

	return WeightData{
		Weight:    weightInt,
		Unit:      "kg", // Default unit
		Stable:    true, // Assume numeric format is always stable
		Timestamp: time.Now(),
	}, nil
}

// isNumeric checks if a string contains only numeric characters (and decimal point)
func (r *SerialReader) isNumeric(s string) bool {
	for _, ch := range s {
		if (ch < '0' || ch > '9') && ch != '.' && ch != '-' && ch != '+' {
			return false
		}
	}
	return len(s) > 0
}

// monitorConnection periodically checks connection health and reconnects if needed
func (r *SerialReader) monitorConnection() {
	ticker := time.NewTicker(3 * time.Second) // Check more frequently
	defer ticker.Stop()

	consecutiveErrors := 0
	maxConsecutiveErrors := 3

	for {
		select {
		case <-r.stopChan:
			return
		case <-ticker.C:
			if !r.IsConnected() && !r.reconnecting {
				log.Println("Connection lost, attempting to reconnect...")
				r.reconnect()
				consecutiveErrors = 0
				continue
			}

			// Perform health check on connected port
			if r.IsConnected() && !r.reconnecting {
				r.mu.Lock()
				port := r.port
				r.mu.Unlock()

				// Try a non-blocking read to test the port health
				if port != nil {
					// Set a very short read timeout for health check
					originalTimeout := r.config.ReadTimeout
					r.config.ReadTimeout = 100 // 100ms timeout for health check

					testCfg := &serial.Config{
						Name:        r.config.COMPort,
						Baud:        r.config.BaudRate,
						Size:        byte(r.config.DataBits),
						StopBits:    serial.StopBits(r.config.StopBits),
						Parity:      serial.ParityNone, // Use default parity for test
						ReadTimeout: 100 * time.Millisecond,
					}

					// Test by trying to open the same port (should fail if already open)
					testPort, err := serial.OpenPort(testCfg)
					if testPort != nil {
						testPort.Close()
					}

					// Restore original timeout
					r.config.ReadTimeout = originalTimeout

					if err != nil {
						// Failed to open same port - this is expected (port is in use)
						consecutiveErrors = 0
					} else {
						// Could open the same port - means original connection is likely broken
						consecutiveErrors++
						log.Printf("Connection health check failed (error %d/%d)", consecutiveErrors, maxConsecutiveErrors)

						if consecutiveErrors >= maxConsecutiveErrors {
							log.Println("Connection appears to be broken, forcing reconnection...")
							consecutiveErrors = 0
							go r.reconnect() // Run in goroutine to avoid blocking
						}
					}
				}
			}
		}
	}
}

// reconnect attempts to reconnect to the serial port
func (r *SerialReader) reconnect() {
	r.mu.Lock()
	if r.reconnecting {
		r.mu.Unlock()
		return
	}
	r.reconnecting = true
	r.mu.Unlock()

	defer func() {
		r.mu.Lock()
		r.reconnecting = false
		r.mu.Unlock()
	}()

	log.Printf("Starting reconnection process for %s...", r.config.COMPort)

	// Close existing connection gracefully
	if err := r.Disconnect(); err != nil {
		log.Printf("Error during disconnect: %v", err)
	}

	// Clear buffer to avoid stale data
	r.buffer.Reset()

	// Exponential backoff for reconnection
	backoff := 1 * time.Second
	maxBackoff := 30 * time.Second
	maxAttempts := 10
	attempts := 0

	for {
		select {
		case <-r.stopChan:
			log.Println("Reconnection stopped due to stop signal")
			return
		default:
			attempts++
			if attempts > maxAttempts {
				log.Printf("Maximum reconnection attempts (%d) reached, giving up", maxAttempts)
				r.errorChan <- fmt.Errorf("failed to reconnect after %d attempts", maxAttempts)
				return
			}

			log.Printf("Reconnection attempt %d/%d to %s...", attempts, maxAttempts, r.config.COMPort)

			if err := r.Connect(); err != nil {
				log.Printf("Reconnection attempt %d failed: %v. Retrying in %v...", attempts, err, backoff)
				time.Sleep(backoff)

				// Increase backoff exponentially
				backoff *= 2
				if backoff > maxBackoff {
					backoff = maxBackoff
				}
			} else {
				log.Printf("Reconnection successful on attempt %d!", attempts)
				// Send success notification on error channel
				select {
				case r.errorChan <- nil: // nil error indicates successful reconnection
				default:
					// Error channel full, skip notification
				}

				// Send reconnection event notification
				select {
				case r.reconnectChan <- struct{}{}:
					log.Println("Reconnection event sent to subscribers")
				default:
					// Reconnect channel full, skip notification
					log.Println("Warning: Reconnect channel full, event not sent")
				}
				return
			}
		}
	}
}

// TestConnection tests if the serial port can be opened
func TestConnection(config types.WeighingConfig) error {
	reader := NewSerialReader(config)
	if err := reader.Connect(); err != nil {
		return err
	}
	return reader.Disconnect()
}

// ListAvailablePorts returns a list of all available COM ports with detailed information
func ListAvailablePorts() []PortInfo {
	var available []PortInfo
	diagnostics := NewWindowsSerialDiagnostics()
	wmiService := NewWindowsWMIService()

	// Try to use WMI for comprehensive port detection
	serialPorts, err := wmiService.QuerySerialPorts()
	if err == nil {
		// Use WMI data
		for _, wmiPort := range serialPorts {
			portInfo := PortInfo{
				Name:         wmiPort.PortName,
				Exists:       true,
				IsVirtual:    wmiPort.IsVirtual,
				DevicePath:   wmiPort.PNPDeviceID,
				DriverInfo:   wmiPort.DriverService,
				FriendlyName: wmiPort.Description,
				VID:          wmiPort.VendorID,
				PID:          wmiPort.ProductID,
				Manufacturer: wmiPort.Manufacturer,
				Description:  wmiPort.Description,
				HardwareIDs:  wmiPort.HardwareIDs,
				IsUSBSerial:  wmiPort.IsUSBSerial,
				MaxBaudRate:  wmiPort.MaxBaudRate,
				ConfigError:  wmiPort.ConfigurationError,
				ErrorCode:    wmiPort.ErrorCode,
			}

			// Test basic accessibility
			test := diagnostics.TestPortAccessibility(portInfo.Name)
			portInfo.CanRead = test.CanRead
			portInfo.CanWrite = test.CanWrite
			portInfo.RequiresAdmin = test.RequiresAdmin

			available = append(available, portInfo)
		}

		log.Printf("Found %d available COM ports via WMI", len(available))
	} else {
		// Fallback to registry-based detection
		log.Printf("WMI detection failed, using fallback method: %v", err)

		// Check COM1 through COM20 with enhanced diagnostics
		for i := 1; i <= 20; i++ {
			portName := fmt.Sprintf("COM%d", i)

			// Get detailed port information
			portInfo := diagnostics.GetPortInfo(portName)

			if portInfo.Exists {
				// Test basic accessibility
				test := diagnostics.TestPortAccessibility(portName)
				portInfo.CanRead = test.CanRead
				portInfo.CanWrite = test.CanWrite
				portInfo.RequiresAdmin = test.RequiresAdmin

				available = append(available, *portInfo)
			}
		}

		log.Printf("Found %d available COM ports via registry", len(available))
	}

	for _, port := range available {
		log.Printf("  %s - Virtual: %t, USB: %t, Admin Required: %t",
			port.Name, port.IsVirtual, port.IsUSBSerial, port.RequiresAdmin)
		if port.VID != "" && port.PID != "" {
			log.Printf("    VID: %s, PID: %s, Manufacturer: %s",
				port.VID, port.PID, port.Manufacturer)
		}
	}

	return available
}

// ListAvailablePortNames returns a simple list of available COM port names (backward compatibility)
func ListAvailablePortNames() []string {
	portInfos := ListAvailablePorts()
	var names []string
	for _, port := range portInfos {
		names = append(names, port.Name)
	}
	return names
}

// getParityConfig converts parity string to serial.Parity
func getParityConfig(parity string) serial.Parity {
	switch parity {
	case "E", "Even":
		return serial.ParityEven
	case "O", "Odd":
		return serial.ParityOdd
	default:
		return serial.ParityNone
	}
}
