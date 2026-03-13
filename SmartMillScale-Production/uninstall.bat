@echo off
echo ========================================
echo Smart Mill Scale Uninstallation Script
echo ========================================
echo.

:: Confirm uninstallation
echo WARNING: This will remove Smart Mill Scale from your system.
echo Database and configuration files will NOT be deleted.
echo.
set /p confirm="Are you sure you want to continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Installation cancelled.
    pause
    exit /b 0
)

echo.
echo Removing Smart Mill Scale...

:: Remove desktop shortcut
echo Removing desktop shortcut...
if exist "%PUBLIC%\Desktop\Smart Mill Scale.lnk" (
    del "%PUBLIC%\Desktop\Smart Mill Scale.lnk"
    echo Desktop shortcut removed.
) else (
    echo Desktop shortcut not found.
)

:: Remove start menu shortcuts
echo Removing Start Menu shortcuts...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SmartMillScale" (
    rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SmartMillScale"
    echo Start Menu shortcuts removed.
) else (
    echo Start Menu shortcuts not found.
)

:: Remove program files
echo Removing program files...
if exist "C:\Program Files\SmartMillScale" (
    rmdir /s /q "C:\Program Files\SmartMillScale"
    echo Program files removed.
) else (
    echo Program files not found.
)

echo.
echo ========================================
echo Uninstallation Complete!
echo ========================================
echo.
echo NOTE: Your data has been preserved:
echo   - Database: %LOCALAPPDATA%\SmartMillScale\data\smartmill.db
echo   - Config: %LOCALAPPDATA%\SmartMillScale\config.json
echo.
echo To completely remove all data, manually delete:
echo   %LOCALAPPDATA%\SmartMillScale
echo.
echo Thank you for using Smart Mill Scale!
echo.
pause