package serial

import (
	"fmt"
	"log"
	"strings"
	"syscall"
	"time"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

// WindowsErrorCode represents Windows-specific error categories
type WindowsErrorCode int

const (
	ErrorAccessDenied WindowsErrorCode = iota
	ErrorHardwareNotFound
	ErrorPortInUse
	ErrorDriverMissing
	ErrorPermissionInsufficient
	ErrorVirtualCOMIssue
	ErrorSystemPermission
	ErrorUnknown
)

// SerialErrorInfo provides detailed error information for serial port issues
type SerialErrorInfo struct {
	ErrorCode     WindowsErrorCode
	OriginalError error
	PortName      string
	Suggestions   []string
	RequiresAdmin bool
	IsVirtual     bool
	Recoverable   bool
	UserMessage   string
	TechnicalInfo string
}

// WindowsSerialDiagnostics provides Windows-specific serial port diagnostics
type WindowsSerialDiagnostics struct{}

// NewWindowsSerialDiagnostics creates a new Windows diagnostics instance
func NewWindowsSerialDiagnostics() *WindowsSerialDiagnostics {
	return &WindowsSerialDiagnostics{}
}

// ClassifyError analyzes an error and provides detailed Windows-specific information
func (d *WindowsSerialDiagnostics) ClassifyError(err error, portName string) *SerialErrorInfo {
	if err == nil {
		return nil
	}

	errorMsg := err.Error()

	// Check for specific Windows error codes
	if errno, ok := err.(syscall.Errno); ok {
		return d.classifyByErrorCode(errno, portName, err)
	}

	// Classify by error message content
	return d.classifyByMessage(errorMsg, portName, err)
}

// classifyByErrorCode handles Windows system error codes
func (d *WindowsSerialDiagnostics) classifyByErrorCode(errno syscall.Errno, portName string, originalErr error) *SerialErrorInfo {
	switch errno {
	case windows.ERROR_ACCESS_DENIED:
		return &SerialErrorInfo{
			ErrorCode:     ErrorAccessDenied,
			OriginalError: originalErr,
			PortName:      portName,
			RequiresAdmin: true,
			Recoverable:   true,
			UserMessage:   fmt.Sprintf("Access denied to %s. This port may require administrator privileges.", portName),
			TechnicalInfo: fmt.Sprintf("Windows error code: %d (ERROR_ACCESS_DENIED)", errno),
			Suggestions: []string{
				"Run the application as Administrator",
				"Check if another application is using this port",
				"Verify your user account has COM port access permissions",
				"Try disconnecting and reconnecting the USB device",
			},
		}

	case windows.ERROR_SHARING_VIOLATION:
		return &SerialErrorInfo{
			ErrorCode:     ErrorPortInUse,
			OriginalError: originalErr,
			PortName:      portName,
			RequiresAdmin: false,
			Recoverable:   true,
			UserMessage:   fmt.Sprintf("Port %s is already in use by another application.", portName),
			TechnicalInfo: fmt.Sprintf("Windows error code: %d (ERROR_SHARING_VIOLATION)", errno),
			Suggestions: []string{
				"Close other applications that might be using this port",
				"Unplug and reconnect the USB device",
				"Restart the application",
				"Try a different COM port",
			},
		}

	case windows.ERROR_FILE_NOT_FOUND:
		return &SerialErrorInfo{
			ErrorCode:     ErrorHardwareNotFound,
			OriginalError: originalErr,
			PortName:      portName,
			RequiresAdmin: false,
			Recoverable:   false,
			UserMessage:   fmt.Sprintf("Serial port %s not found. The device may not be connected.", portName),
			TechnicalInfo: fmt.Sprintf("Windows error code: %d (ERROR_FILE_NOT_FOUND)", errno),
			Suggestions: []string{
				"Check if the USB device is properly connected",
				"Verify the device drivers are installed",
				"Try a different USB port",
				"Check Device Manager for COM port availability",
			},
		}

	default:
		return &SerialErrorInfo{
			ErrorCode:     ErrorUnknown,
			OriginalError: originalErr,
			PortName:      portName,
			RequiresAdmin: false,
			Recoverable:   true,
			UserMessage:   fmt.Sprintf("Unknown error accessing %s: %s", portName, originalErr.Error()),
			TechnicalInfo: fmt.Sprintf("Windows error code: %d", errno),
			Suggestions: []string{
				"Try running as Administrator",
				"Check device connection",
				"Restart the application",
				"Contact technical support if the problem persists",
			},
		}
	}
}

// classifyByMessage analyzes error messages for non-Windows error codes
func (d *WindowsSerialDiagnostics) classifyByMessage(errorMsg, portName string, originalErr error) *SerialErrorInfo {
	switch {
	case containsIgnoreCase(errorMsg, "access is denied") || containsIgnoreCase(errorMsg, "permission denied"):
		return &SerialErrorInfo{
			ErrorCode:     ErrorPermissionInsufficient,
			OriginalError: originalErr,
			PortName:      portName,
			RequiresAdmin: true,
			Recoverable:   true,
			UserMessage:   fmt.Sprintf("Permission denied accessing %s. Administrator privileges may be required.", portName),
			TechnicalInfo: fmt.Sprintf("Error message: %s", errorMsg),
			Suggestions: []string{
				"Right-click the application and select 'Run as administrator'",
				"Check if your user account has COM port access rights",
				"Verify the device is not being used by another application",
			},
		}

	case containsIgnoreCase(errorMsg, "already in use") || containsIgnoreCase(errorMsg, "busy"):
		return &SerialErrorInfo{
			ErrorCode:     ErrorPortInUse,
			OriginalError: originalErr,
			PortName:      portName,
			RequiresAdmin: false,
			Recoverable:   true,
			UserMessage:   fmt.Sprintf("Port %s is currently in use by another application.", portName),
			TechnicalInfo: fmt.Sprintf("Error message: %s", errorMsg),
			Suggestions: []string{
				"Close applications that might be using this COM port",
				"Unplug and reconnect the USB device",
				"Restart your computer if the port remains busy",
			},
		}

	case containsIgnoreCase(errorMsg, "not found") || containsIgnoreCase(errorMsg, "does not exist"):
		return &SerialErrorInfo{
			ErrorCode:     ErrorHardwareNotFound,
			OriginalError: originalErr,
			PortName:      portName,
			RequiresAdmin: false,
			Recoverable:   false,
			UserMessage:   fmt.Sprintf("Serial port %s was not found. Check device connection.", portName),
			TechnicalInfo: fmt.Sprintf("Error message: %s", errorMsg),
			Suggestions: []string{
				"Verify the USB device is connected and recognized by Windows",
				"Check Device Manager for COM port availability",
				"Install or update device drivers",
				"Try a different USB cable or port",
			},
		}

	default:
		return &SerialErrorInfo{
			ErrorCode:     ErrorUnknown,
			OriginalError: originalErr,
			PortName:      portName,
			RequiresAdmin: false,
			Recoverable:   true,
			UserMessage:   fmt.Sprintf("Unexpected error with %s: %s", portName, errorMsg),
			TechnicalInfo: fmt.Sprintf("Original error: %v", originalErr),
			Suggestions: []string{
				"Try running the application as Administrator",
				"Check device connection and drivers",
				"Restart the application",
				"Contact support if the issue persists",
			},
		}
	}
}

// GetPortInfo retrieves detailed information about a COM port
func (d *WindowsSerialDiagnostics) GetPortInfo(portName string) *PortInfo {
	info := &PortInfo{
		Name:      portName,
		IsVirtual: false,
		Exists:    false,
	}

	// Check if port exists in registry
	regKey := `HARDWARE\DEVICEMAP\SERIALCOMM`
	k, err := registry.OpenKey(registry.LOCAL_MACHINE, regKey, registry.READ)
	if err != nil {
		log.Printf("Failed to open registry key for serial ports: %v", err)
		return info
	}
	defer k.Close()

	portNames, err := k.ReadValueNames(0)
	if err != nil {
		log.Printf("Failed to read serial port names from registry: %v", err)
		return info
	}

	for _, name := range portNames {
		if value, _, err := k.GetStringValue(name); err == nil {
			if value == portName {
				info.Exists = true
				info.DevicePath = name
				break
			}
		}
	}

	// No WMI queries - port is configured from .env, no need for detailed detection
	info.IsVirtual = d.isVirtualCOMPort(portName)
	d.getDetailedPortInfo(info)

	return info
}

// PortInfo contains detailed information about a COM port
type PortInfo struct {
	Name          string
	Exists        bool
	IsVirtual     bool
	DevicePath    string
	DriverInfo    string
	FriendlyName  string
	VID           string   // Vendor ID
	PID           string   // Product ID
	Manufacturer  string   // Device manufacturer
	Description   string   // Device description
	HardwareIDs   []string // Hardware identification strings
	IsUSBSerial   bool     // Is this a USB-to-serial adapter
	MaxBaudRate   uint32   // Maximum supported baud rate
	CanRead       bool     // Basic read accessibility
	CanWrite      bool     // Basic write accessibility
	RequiresAdmin bool     // Whether admin privileges are needed
	ConfigError   bool     // Configuration/driver error present
	ErrorCode     uint32   // Windows configuration error code
}

// isVirtualCOMPort attempts to determine if a COM port is virtual/emulated
func (d *WindowsSerialDiagnostics) isVirtualCOMPort(portName string) bool {
	// Check common virtual COM port patterns
	virtualPatterns := []string{
		"USB-SERIAL",
		"CH340", "CH341", // Common USB-to-serial chips
		"FTDI", "FT232", // FTDI chips
		"Prolific", "PL2303", // Prolific chips
		"CP210x", // Silicon Labs chips
		"CDC",    // USB CDC devices
	}

	regKey := `SYSTEM\CurrentControlSet\Enum\USB`
	k, err := registry.OpenKey(registry.LOCAL_MACHINE, regKey, registry.READ)
	if err != nil {
		return false
	}
	defer k.Close()

	// Enumerate USB devices to find virtual COM ports
	return d.searchUSBForVirtualPort(k, portName, virtualPatterns)
}

// searchUSBForVirtualPort searches USB registry entries for virtual COM ports
func (d *WindowsSerialDiagnostics) searchUSBForVirtualPort(k registry.Key, portName string, patterns []string) bool {
	// This is a simplified implementation
	// In production, you'd want to enumerate all USB devices and check their port mappings
	for _, pattern := range patterns {
		// Check if the port name or device path contains virtual port indicators
		if containsIgnoreCase(portName, pattern) {
			return true
		}
	}
	return false
}

// getDetailedPortInfo retrieves additional port information
func (d *WindowsSerialDiagnostics) getDetailedPortInfo(info *PortInfo) {
	// This would involve WMI queries or additional registry lookups
	// For now, we'll provide a basic implementation

	if info.Exists {
		// Try to get friendly name and additional info
		// In a full implementation, this would use WMI or SetupAPI
		info.FriendlyName = fmt.Sprintf("Serial Port %s", info.Name)
	}
}

// TestPortAccessibility tests if a port can be accessed with current privileges
func (d *WindowsSerialDiagnostics) TestPortAccessibility(portName string) *AccessibilityTest {
	result := &AccessibilityTest{
		PortName:      portName,
		CanRead:       false,
		CanWrite:      false,
		RequiresAdmin: false,
		TestTime:      time.Now(),
	}

	// Try to test basic port access
	// This is a simplified test - in production, you'd want more comprehensive testing

	// Check if we can enumerate the port (basic accessibility)
	if d.canEnumeratePort(portName) {
		result.CanRead = true
	}

	// Check if admin privileges are required
	if d.requiresAdminForPort(portName) {
		result.RequiresAdmin = true
	}

	return result
}

// AccessibilityTest represents the results of port accessibility testing
type AccessibilityTest struct {
	PortName      string
	CanRead       bool
	CanWrite      bool
	RequiresAdmin bool
	TestTime      time.Time
	ErrorMessage  string
}

// canEnumeratePort checks if we can enumerate port information
func (d *WindowsSerialDiagnostics) canEnumeratePort(portName string) bool {
	info := d.GetPortInfo(portName)
	return info.Exists
}

// requiresAdminForPort determines if admin privileges are needed
func (d *WindowsSerialDiagnostics) requiresAdminForPort(portName string) bool {
	// For virtual COM ports and some USB serial devices, admin privileges might be required
	info := d.GetPortInfo(portName)
	if info.IsVirtual {
		return true // Virtual COM ports often require admin access
	}
	return false
}

// ElevationRequired checks if the current process needs elevation for serial port access
func (d *WindowsSerialDiagnostics) ElevationRequired(portName string) bool {
	// Check if running as administrator
	if !d.isRunningAsAdmin() {
		// Test if the port can be accessed without admin rights
		test := d.TestPortAccessibility(portName)
		return test.RequiresAdmin || !test.CanRead
	}
	return false
}

// isRunningAsAdmin checks if the current process has administrative privileges
func (d *WindowsSerialDiagnostics) isRunningAsAdmin() bool {
	var sid *windows.SID
	err := windows.AllocateAndInitializeSid(
		&windows.SECURITY_NT_AUTHORITY,
		2,
		windows.SECURITY_BUILTIN_DOMAIN_RID,
		windows.DOMAIN_ALIAS_RID_ADMINS,
		0, 0, 0, 0, 0, 0,
		&sid,
	)
	if err != nil {
		return false
	}
	defer windows.FreeSid(sid)

	token := windows.Token(0) // Current process token
	member, err := token.IsMember(sid)
	if err != nil {
		return false
	}
	return member
}

// RequestElevation attempts to restart the application with elevated privileges
func (d *WindowsSerialDiagnostics) RequestElevation() error {
	// This would use ShellExecuteW with "runas" verb to request elevation
	// For security reasons, this is a placeholder - the actual elevation
	// should be handled at the application level with proper user consent

	log.Println("Elevation request: Application restart with administrator privileges required")
	return fmt.Errorf("manual elevation required - please restart as administrator")
}

// containsIgnoreCase performs case-insensitive substring search
func containsIgnoreCase(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		(len(s) > len(substr) &&
			(s[:len(substr)] == substr ||
				s[len(s)-len(substr):] == substr ||
				findSubstringIgnoreCase(s, substr))))
}

// findSubstringIgnoreCase helper function for case-insensitive substring search
func findSubstringIgnoreCase(s, substr string) bool {
	sLower := strings.ToLower(s)
	substrLower := strings.ToLower(substr)
	return strings.Contains(sLower, substrLower)
}
