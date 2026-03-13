package serial

import (
	"fmt"
	"log"
	"strings"

	"github.com/StackExchange/wmi"
)

// Win32_SerialPort represents a Win32_SerialPort WMI class instance
type Win32_SerialPort struct {
	Name                    string
	DeviceID                string
	Description             string
	PNPDeviceID             string
	Status                  string
	ConfigManagerErrorCode  uint32
	ConfigManagerUserConfig bool
	MaxBaudRate             uint32
}

// Win32_PnPEntity represents a Win32_PnPEntity WMI class instance
type Win32_PnPEntity struct {
	Name                   string
	DeviceID               string
	Description            string
	Manufacturer           string
	Service                string
	Status                 string
	ClassGuid              string
	HardwareID             []string
	CompatibleID           []string
	ConfigManagerErrorCode uint32
}

// WMIPortInfo contains comprehensive WMI-based port information
type WMIPortInfo struct {
	PortName           string
	DeviceID           string
	Description        string
	Manufacturer       string
	PNPDeviceID        string
	VendorID           string // USB Vendor ID (VID)
	ProductID          string // USB Product ID (PID)
	HardwareIDs        []string
	DriverService      string
	Status             string
	IsVirtual          bool
	IsUSBSerial        bool
	MaxBaudRate        uint32
	ConfigurationError bool
	ErrorCode          uint32
}

// WindowsWMIService provides WMI-based COM port diagnostics
type WindowsWMIService struct{}

// NewWindowsWMIService creates a new WMI service instance
func NewWindowsWMIService() *WindowsWMIService {
	return &WindowsWMIService{}
}

// QuerySerialPorts queries all serial ports using Win32_SerialPort WMI class
func (w *WindowsWMIService) QuerySerialPorts() ([]WMIPortInfo, error) {
	var serialPorts []Win32_SerialPort
	var portInfos []WMIPortInfo

	// Query Win32_SerialPort
	query := "SELECT * FROM Win32_SerialPort"
	err := wmi.Query(query, &serialPorts)
	if err != nil {
		return nil, fmt.Errorf("WMI query for serial ports failed: %w", err)
	}

	log.Printf("WMI: Found %d serial ports", len(serialPorts))

	// Process each serial port
	for _, port := range serialPorts {
		portInfo := WMIPortInfo{
			PortName:           port.DeviceID, // e.g., "COM1"
			DeviceID:           port.DeviceID,
			Description:        port.Description,
			PNPDeviceID:        port.PNPDeviceID,
			Status:             port.Status,
			MaxBaudRate:        port.MaxBaudRate,
			ConfigurationError: port.ConfigManagerErrorCode != 0,
			ErrorCode:          port.ConfigManagerErrorCode,
		}

		// If we have a PNP Device ID, query additional details
		if port.PNPDeviceID != "" {
			if details, err := w.QueryPnPDeviceDetails(port.PNPDeviceID); err == nil {
				portInfo.Manufacturer = details.Manufacturer
				portInfo.HardwareIDs = details.HardwareID
				portInfo.DriverService = details.Service

				// Extract VID/PID from hardware IDs if this is a USB device
				portInfo.VendorID, portInfo.ProductID = extractVIDPID(details.HardwareID)

				// Determine if this is a virtual/USB serial adapter
				portInfo.IsUSBSerial = isUSBSerialAdapter(details.HardwareID, details.Service)
				portInfo.IsVirtual = isVirtualCOMPort(details.HardwareID, details.Service, details.Manufacturer)
			}
		}

		portInfos = append(portInfos, portInfo)
	}

	return portInfos, nil
}

// QueryPnPDeviceDetails queries detailed PnP device information
func (w *WindowsWMIService) QueryPnPDeviceDetails(pnpDeviceID string) (*Win32_PnPEntity, error) {
	var devices []Win32_PnPEntity

	// Escape backslashes in the device ID for WMI query
	escapedID := strings.ReplaceAll(pnpDeviceID, `\`, `\\`)

	query := fmt.Sprintf("SELECT * FROM Win32_PnPEntity WHERE DeviceID = '%s'", escapedID)
	err := wmi.Query(query, &devices)
	if err != nil {
		return nil, fmt.Errorf("WMI query for PnP device failed: %w", err)
	}

	if len(devices) == 0 {
		return nil, fmt.Errorf("no PnP device found with ID: %s", pnpDeviceID)
	}

	return &devices[0], nil
}

// QueryUSBSerialDevices specifically queries for USB serial devices
func (w *WindowsWMIService) QueryUSBSerialDevices() ([]WMIPortInfo, error) {
	var devices []Win32_PnPEntity
	var portInfos []WMIPortInfo

	// Query for USB devices (class GUID for Ports - {4D36E978-E325-11CE-BFC1-08002BE10318})
	query := "SELECT * FROM Win32_PnPEntity WHERE ClassGuid = '{4D36E978-E325-11CE-BFC1-08002BE10318}'"
	err := wmi.Query(query, &devices)
	if err != nil {
		return nil, fmt.Errorf("WMI query for USB serial devices failed: %w", err)
	}

	log.Printf("WMI: Found %d port-class PnP devices", len(devices))

	// Filter for USB devices and extract port information
	for _, device := range devices {
		// Check if this is a USB device
		if !strings.Contains(strings.ToUpper(device.DeviceID), "USB") {
			continue
		}

		// Extract port name from device name (usually contains "COMx")
		portName := extractCOMPortName(device.Name)
		if portName == "" {
			continue // Skip if no COM port found
		}

		portInfo := WMIPortInfo{
			PortName:           portName,
			DeviceID:           device.DeviceID,
			Description:        device.Description,
			Manufacturer:       device.Manufacturer,
			PNPDeviceID:        device.DeviceID,
			HardwareIDs:        device.HardwareID,
			DriverService:      device.Service,
			Status:             device.Status,
			ConfigurationError: device.ConfigManagerErrorCode != 0,
			ErrorCode:          device.ConfigManagerErrorCode,
		}

		// Extract VID/PID
		portInfo.VendorID, portInfo.ProductID = extractVIDPID(device.HardwareID)

		// Mark as USB serial and determine if virtual
		portInfo.IsUSBSerial = true
		portInfo.IsVirtual = isVirtualCOMPort(device.HardwareID, device.Service, device.Manufacturer)

		portInfos = append(portInfos, portInfo)
	}

	return portInfos, nil
}

// GetPortWMIInfo retrieves comprehensive WMI information for a specific port
func (w *WindowsWMIService) GetPortWMIInfo(portName string) (*WMIPortInfo, error) {
	// First try to get from serial ports
	serialPorts, err := w.QuerySerialPorts()
	if err != nil {
		log.Printf("Warning: Failed to query serial ports via WMI: %v", err)
	} else {
		for _, port := range serialPorts {
			if port.PortName == portName {
				return &port, nil
			}
		}
	}

	// Try USB serial devices
	usbPorts, err := w.QueryUSBSerialDevices()
	if err != nil {
		log.Printf("Warning: Failed to query USB serial devices via WMI: %v", err)
	} else {
		for _, port := range usbPorts {
			if port.PortName == portName {
				return &port, nil
			}
		}
	}

	return nil, fmt.Errorf("port %s not found in WMI data", portName)
}

// extractVIDPID extracts vendor and product IDs from hardware ID strings
// Example: "USB\VID_0403&PID_6001" -> ("0403", "6001")
func extractVIDPID(hardwareIDs []string) (vid, pid string) {
	for _, hwid := range hardwareIDs {
		upper := strings.ToUpper(hwid)

		// Look for VID_xxxx pattern
		if vidIdx := strings.Index(upper, "VID_"); vidIdx != -1 {
			start := vidIdx + 4
			end := start + 4
			if end <= len(upper) {
				vid = hwid[start:end]
			}
		}

		// Look for PID_xxxx pattern
		if pidIdx := strings.Index(upper, "PID_"); pidIdx != -1 {
			start := pidIdx + 4
			end := start + 4
			if end <= len(upper) {
				pid = hwid[start:end]
			}
		}

		// If we found both, return
		if vid != "" && pid != "" {
			return vid, pid
		}
	}

	return "", ""
}

// extractCOMPortName extracts COM port name from device name/description
// Example: "USB Serial Port (COM5)" -> "COM5"
func extractCOMPortName(deviceName string) string {
	// Look for pattern "(COMx)" or "COMx"
	upper := strings.ToUpper(deviceName)

	// Try pattern with parentheses first
	if startIdx := strings.Index(upper, "(COM"); startIdx != -1 {
		endIdx := strings.Index(upper[startIdx:], ")")
		if endIdx != -1 {
			return deviceName[startIdx+1 : startIdx+endIdx]
		}
	}

	// Try pattern without parentheses
	if startIdx := strings.Index(upper, "COM"); startIdx != -1 {
		// Extract COMx where x is one or more digits
		portName := "COM"
		for i := startIdx + 3; i < len(deviceName); i++ {
			if deviceName[i] >= '0' && deviceName[i] <= '9' {
				portName += string(deviceName[i])
			} else {
				break
			}
		}
		if len(portName) > 3 {
			return portName
		}
	}

	return ""
}

// isUSBSerialAdapter determines if hardware IDs indicate a USB serial adapter
func isUSBSerialAdapter(hardwareIDs []string, service string) bool {
	for _, hwid := range hardwareIDs {
		upper := strings.ToUpper(hwid)

		// Common USB serial adapter patterns
		if strings.Contains(upper, "USB\\VID_") {
			return true
		}
	}

	// Check service name for USB serial drivers
	upperService := strings.ToUpper(service)
	usbSerialDrivers := []string{"USBSER", "FTDIBUS", "SILABSER", "CH341SER", "PROLIFIC"}
	for _, driver := range usbSerialDrivers {
		if strings.Contains(upperService, driver) {
			return true
		}
	}

	return false
}

// isVirtualCOMPort determines if this is a virtual/emulated COM port
func isVirtualCOMPort(hardwareIDs []string, service string, manufacturer string) bool {
	// Check for common virtual COM port indicators
	virtualIndicators := []string{
		"VCOM",
		"VIRTUAL",
		"NULL-MODEM",
		"COM0COM",
		"VSPE",
	}

	for _, hwid := range hardwareIDs {
		upper := strings.ToUpper(hwid)
		for _, indicator := range virtualIndicators {
			if strings.Contains(upper, indicator) {
				return true
			}
		}
	}

	// Check service name
	upperService := strings.ToUpper(service)
	for _, indicator := range virtualIndicators {
		if strings.Contains(upperService, indicator) {
			return true
		}
	}

	// Check manufacturer
	upperManufacturer := strings.ToUpper(manufacturer)
	virtualManufacturers := []string{
		"ELTIMA",
		"VIRTUAL",
		"VSPE",
	}
	for _, vMfg := range virtualManufacturers {
		if strings.Contains(upperManufacturer, vMfg) {
			return true
		}
	}

	return false
}
