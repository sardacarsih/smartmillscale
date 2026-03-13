@echo off
echo ========================================
echo Smart Mill Scale Installation Script
echo ========================================
echo.

:: Check if running as Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator...
) else (
    echo Warning: Not running as Administrator.
    echo Some installation steps may require elevated privileges.
    echo.
)

:: Create program files directory
echo Creating installation directory...
if not exist "C:\Program Files\SmartMillScale" (
    mkdir "C:\Program Files\SmartMillScale"
    echo Created: C:\Program Files\SmartMillScale
)

:: Copy executable
echo Copying application files...
copy "Smart Mill Scale.exe" "C:\Program Files\SmartMillScale\" >nul
if %errorLevel% == 0 (
    echo Success: Executable copied
) else (
    echo Error: Failed to copy executable
    pause
    exit /b 1
)

:: Copy config file
copy "config.json" "C:\Program Files\SmartMillScale\" >nul
if %errorLevel% == 0 (
    echo Success: Configuration copied
) else (
    echo Warning: Failed to copy configuration
)

:: Create desktop shortcut
echo Creating desktop shortcut...
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%PUBLIC%\Desktop\Smart Mill Scale.lnk'); $Shortcut.TargetPath = 'C:\Program Files\SmartMillScale\Smart Mill Scale.exe'; $Shortcut.WorkingDirectory = 'C:\Program Files\SmartMillScale'; $Shortcut.Save()"

:: Create start menu shortcut
echo Creating Start Menu shortcut...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SmartMillScale" (
    mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SmartMillScale"
)
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\SmartMillScale\Smart Mill Scale.lnk'); $Shortcut.TargetPath = 'C:\Program Files\SmartMillScale\Smart Mill Scale.exe'; $Shortcut.WorkingDirectory = 'C:\Program Files\SmartMillScale'; $Shortcut.Save()"

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Application installed to: C:\Program Files\SmartMillScale
echo Desktop shortcut created
echo Start Menu shortcut created
echo.
echo Default Login Credentials:
echo   Username: admin      Password: admin123
echo   Username: supervisor Password: supervisor123
echo   Username: operator   Password: operator123
echo   Username: grading    Password: grading123
echo.
echo IMPORTANT: Change default passwords after first login!
echo.
echo Press any key to launch Smart Mill Scale...
pause >nul

:: Launch application
start "" "C:\Program Files\SmartMillScale\Smart Mill Scale.exe"