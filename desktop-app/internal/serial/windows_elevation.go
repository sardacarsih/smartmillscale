package serial

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

// WindowsElevation handles Windows-specific privilege elevation for COM port access
type WindowsElevation struct{}

// NewWindowsElevation creates a new Windows elevation handler
func NewWindowsElevation() *WindowsElevation {
	return &WindowsElevation{}
}

// IsRunningAsAdmin checks if the current process has administrator privileges
func (e *WindowsElevation) IsRunningAsAdmin() bool {
	if runtime.GOOS != "windows" {
		return true // Non-Windows systems don't need elevation
	}

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
		log.Printf("Failed to allocate SID: %v", err)
		return false
	}
	defer windows.FreeSid(sid)

	// Get current process token
	token := windows.GetCurrentProcessToken()
	defer token.Close()

	member, err := token.IsMember(sid)
	if err != nil {
		log.Printf("Failed to check token membership: %v", err)
		return false
	}

	return member
}

// RequestElevation attempts to restart the application with elevated privileges
func (e *WindowsElevation) RequestElevation(applicationPath string, args []string) error {
	if runtime.GOOS != "windows" {
		return fmt.Errorf("elevation only supported on Windows")
	}

	// Check if we're already running as admin
	if e.IsRunningAsAdmin() {
		log.Println("Already running with administrator privileges")
		return nil
	}

	log.Println("Requesting administrator privileges for COM port access...")

	// Prepare the command with arguments
	cmdLine := fmt.Sprintf(`"%s"`, applicationPath)
	if len(args) > 0 {
		cmdLine += " " + strings.Join(args, " ")
	}

	// Convert to UTF16 pointer for ShellExecute
	cmdLinePtr, err := windows.UTF16PtrFromString(cmdLine)
	if err != nil {
		return fmt.Errorf("failed to convert command line: %v", err)
	}

	verbPtr, err := windows.UTF16PtrFromString("runas") // Request elevation
	if err != nil {
		return fmt.Errorf("failed to convert verb: %v", err)
	}

	// Use ShellExecute to request elevation
	ret, _, err := syscall.NewLazyDLL("shell32.dll").NewProc("ShellExecuteW").Call(
		0,
		uintptr(unsafe.Pointer(verbPtr)),
		uintptr(unsafe.Pointer(cmdLinePtr)),
		0, // Parameters (included in cmdLine)
		0, // Directory (use current)
		0, // Show command (use default)
	)

	// ShellExecute returns a value > 32 on success
	if ret <= 32 {
		return fmt.Errorf("ShellExecute failed with return code: %d, error: %v", ret, err)
	}

	log.Println("Elevation request sent successfully")
	return nil
}

// GetExecutablePath returns the path to the current executable
func (e *WindowsElevation) GetExecutablePath() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to get executable path: %v", err)
	}

	// Convert to absolute path
	exePath, err = filepath.Abs(exePath)
	if err != nil {
		return "", fmt.Errorf("failed to resolve absolute path: %v", err)
	}

	return exePath, nil
}

// RestartElevated restarts the current application with elevated privileges
func (e *WindowsElevation) RestartElevated(additionalArgs ...string) error {
	exePath, err := e.GetExecutablePath()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %v", err)
	}

	// Get current command line arguments
	args := os.Args[1:] // Skip the executable name

	// Add any additional arguments
	args = append(args, additionalArgs...)

	// Add a flag to indicate this is an elevated restart
	args = append(args, "--elevated-restart")

	log.Printf("Restarting application with elevation: %s %v", exePath, args)

	return e.RequestElevation(exePath, args)
}

// CheckElevationRequired determines if elevation is required for the given COM port
func (e *WindowsElevation) CheckElevationRequired(portName string, diagnostics *WindowsSerialDiagnostics) bool {
	if runtime.GOOS != "windows" {
		return false
	}

	// Check system-wide privileges
	if !e.IsRunningAsAdmin() {
		// Test port accessibility
		test := diagnostics.TestPortAccessibility(portName)
		if test.RequiresAdmin || !test.CanRead {
			log.Printf("Port %s requires administrator privileges", portName)
			return true
		}

		// Check if it's a virtual COM port (these often require admin)
		portInfo := diagnostics.GetPortInfo(portName)
		if portInfo.IsVirtual {
			log.Printf("Virtual COM port %s may require administrator privileges", portName)
			return true
		}
	}

	return false
}

// ElevateIfNeeded checks if elevation is needed and requests it if necessary
func (e *WindowsElevation) ElevateIfNeeded(portName string, diagnostics *WindowsSerialDiagnostics) error {
	if e.CheckElevationRequired(portName, diagnostics) {
		log.Println("Administrator privileges required for COM port access")
		log.Println("Attempting to restart with elevated privileges...")

		if err := e.RestartElevated(); err != nil {
			return fmt.Errorf("failed to restart with elevation: %v", err)
		}

		// If we reach here, the elevation request was sent
		// The current process should exit to allow the elevated process to start
		os.Exit(0)
	}

	return nil
}

// IsElevatedRestart checks if the application was started with elevated restart flag
func (e *WindowsElevation) IsElevatedRestart() bool {
	for _, arg := range os.Args {
		if arg == "--elevated-restart" {
			return true
		}
	}
	return false
}

// GetElevationStatus provides information about the current elevation status
type ElevationStatus struct {
	IsAdmin           bool
	IsElevatedRestart bool
	CanElevate        bool
	RequiresElevation bool
	PortName          string
	Suggestions       []string
}

// GetElevationStatus returns comprehensive elevation status information
func (e *WindowsElevation) GetElevationStatus(portName string, diagnostics *WindowsSerialDiagnostics) *ElevationStatus {
	status := &ElevationStatus{
		IsAdmin:           e.IsRunningAsAdmin(),
		IsElevatedRestart: e.IsElevatedRestart(),
		CanElevate:        true, // We can always try to elevate on Windows
		PortName:          portName,
	}

	// Check if elevation is required for this port
	if runtime.GOOS == "windows" && !status.IsAdmin {
		status.RequiresElevation = e.CheckElevationRequired(portName, diagnostics)
	}

	// Generate suggestions based on status
	if status.RequiresElevation && !status.IsAdmin {
		status.Suggestions = []string{
			"Allow the application to restart with administrator privileges when prompted",
			"Right-click the application and select 'Run as administrator'",
			"Check if the COM port device drivers are properly installed",
			"Verify the USB device is connected and recognized by Windows",
		}
	} else if status.IsAdmin {
		status.Suggestions = []string{
			"Running with administrator privileges - COM port access should be available",
			"Check Device Manager if connection issues persist",
			"Verify the scale device is properly connected",
		}
	} else {
		status.Suggestions = []string{
			"Standard user privileges - COM port access should work for most devices",
			"Contact your system administrator if access is denied",
			"Check if the COM port is being used by another application",
		}
	}

	return status
}
