# Environment Configuration Guide

This document explains how to use dynamic configuration with `.env` files for the Smart Mill Scale application.

## Overview

The Smart Mill Scale application now supports environment-based configuration for both backend (Go) and frontend (React) components. This allows you to:

- Easily switch between development, staging, and production environments
- Override configuration values without modifying code
- Keep sensitive information out of version control
- Customize application behavior per deployment

## 📁 Files Created

### Backend Configuration
- `desktop-app/.env` - Active environment configuration
- `desktop-app/.env.example` - Template with all available options

### Frontend Configuration
- `desktop-app/frontend/.env` - Active environment configuration
- `desktop-app/frontend/.env.example` - Template with all available options
- `desktop-app/frontend/src/config/env.js` - Configuration loader and validator

### Git Configuration
- `.gitignore` - Updated to exclude `.env` files (protecting sensitive data)

## 🚀 Quick Start

### 1. Copy Environment Templates
```bash
# Backend
cp desktop-app/.env.example desktop-app/.env

# Frontend
cp desktop-app/frontend/.env.example desktop-app/frontend/.env
```

### 2. Modify Configuration
Edit the `.env` files to match your environment:

**Backend (desktop-app/.env):**
```bash
# Database Configuration
DB_PATH=./data/smartmill.db

# Serial Port Configuration
SERIAL_COM_PORT=COM1
SERIAL_BAUD_RATE=9600

# Sync Configuration
SYNC_SERVER_URL=https://localhost:8443/graphql
SYNC_INTERVAL=5m
SYNC_BATCH_SIZE=50
```

**Frontend (desktop-app/frontend/.env):**
```bash
# Application Configuration
VITE_APP_NAME=Smart Mill Scale
VITE_APP_VERSION=1.0.0

# Update Intervals (milliseconds)
VITE_WEIGHT_UPDATE_INTERVAL=1000
VITE_SYNC_STATUS_UPDATE_INTERVAL=30000

# Feature Flags
VITE_ENABLE_MOCK_SERIAL=true
VITE_ENABLE_OFFLINE_MODE=true
```

### 3. Restart Application
```bash
# Stop any running instances
# Then restart
cd desktop-app && wails dev
```

## 🔧 Backend Configuration Options

### Application Settings
```bash
APP_NAME=Smart Mill Scale
APP_VERSION=1.0.0
APP_ENV=development
APP_DEBUG=true
```

### Database Configuration
```bash
DB_TYPE=sqlite
DB_PATH=./data/smartmill.db
DB_MAX_CONNECTIONS=1
```

### Serial Port Configuration
```bash
SERIAL_COM_PORT=COM1
SERIAL_BAUD_RATE=9600
SERIAL_DATA_BITS=8
SERIAL_STOP_BITS=1
SERIAL_PARITY=N
SERIAL_TIMEOUT=5s
SERIAL_READ_TIMEOUT=1s
SERIAL_WRITE_TIMEOUT=1s
```

### Mock Serial Configuration (Development)
```bash
MOCK_SERIAL_ENABLED=true
MOCK_SERIAL_INTERVAL=1s
MOCK_SERIAL_MIN_WEIGHT=0
MOCK_SERIAL_MAX_WEIGHT=150
MOCK_SERIAL_VARIANCE=5
```

### Synchronization Configuration
```bash
SYNC_ENABLED=true
SYNC_SERVER_URL=https://localhost:8443/graphql
SYNC_INTERVAL=5m
SYNC_BATCH_SIZE=50
SYNC_MAX_RETRIES=5
SYNC_RETRY_DELAY=1s
SYNC_MAX_RETRY_DELAY=60s
SYNC_HEALTH_CHECK_INTERVAL=30s
```

### Device Configuration
```bash
DEVICE_ID_AUTO_GENERATE=true
DEVICE_NAME_DEFAULT=Timbangan Baru
DEVICE_LOCATION_DEFAULT=Gudang
```

### Authentication Configuration
```bash
AUTH_SESSION_TIMEOUT=30m
AUTH_PASSWORD_MIN_LENGTH=8
AUTH_PASSWORD_REQUIRE_UPPERCASE=true
AUTH_PASSWORD_REQUIRE_LOWERCASE=true
AUTH_PASSWORD_REQUIRE_NUMBERS=true
AUTH_PASSWORD_REQUIRE_SYMBOLS=true
```

## ⚙️ Frontend Configuration Options

### Application Settings
```bash
VITE_APP_NAME=Smart Mill Scale
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Sistem Penimbangan Offline dengan Sinkronisasi Cloud
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

### API Configuration
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
```

### Authentication Configuration
```bash
VITE_AUTH_SESSION_TIMEOUT=1800000    # 30 minutes in milliseconds
VITE_AUTH_WARNING_TIMEOUT=120000     # 2 minutes in milliseconds
```

### Real-time Update Intervals
```bash
VITE_WEIGHT_UPDATE_INTERVAL=1000      # 1 second
VITE_SYNC_STATUS_UPDATE_INTERVAL=30000 # 30 seconds
VITE_SYNC_HISTORY_UPDATE_INTERVAL=60000 # 1 minute
VITE_CHART_REFRESH_INTERVAL=5000      # 5 seconds
VITE_SERIAL_UPDATE_INTERVAL=1000      # 1 second
```

### Feature Flags
```bash
VITE_ENABLE_MOCK_SERIAL=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
VITE_ENABLE_SOUND_NOTIFICATIONS=false
```

### UI Configuration
```bash
VITE_THEME=dark
VITE_LANGUAGE=id
VITE_TIMEZONE=Asia/Jakarta
```

### Performance Configuration
```bash
VITE_CACHE_ENABLED=true
VITE_LAZY_LOADING=true
VITE_CHUNK_SIZE_WARNING_LIMIT=1000
```

### Notification Configuration
```bash
VITE_NOTIFICATION_DURATION=5000      # 5 seconds
VITE_NOTIFICATION_MAX_COUNT=5
VITE_ENABLE_SOUND_NOTIFICATIONS=false
```

## 🌍 Environment-Specific Configuration

### Development Environment
```bash
# Backend
APP_ENV=development
APP_DEBUG=true
MOCK_SERIAL_ENABLED=true
SYNC_ENABLED=false

# Frontend
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_ENABLE_MOCK_SERIAL=true
VITE_DEV_MODE=true
```

### Production Environment
```bash
# Backend
APP_ENV=production
APP_DEBUG=false
MOCK_SERIAL_ENABLED=false
SYNC_ENABLED=true

# Frontend
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_ENABLE_MOCK_SERIAL=false
VITE_DEV_MODE=false
```

### Staging Environment
```bash
# Backend
APP_ENV=staging
APP_DEBUG=true
MOCK_SERIAL_ENABLED=false
SYNC_ENABLED=true

# Frontend
VITE_APP_ENV=staging
VITE_DEBUG_MODE=true
VITE_ENABLE_MOCK_SERIAL=false
VITE_DEV_MODE=true
```

## 🔐 Security Best Practices

### 1. Keep Sensitive Data Out of Version Control
- ✅ `.env` files are in `.gitignore`
- ✅ Use `.env.example` as templates
- ✅ Never commit actual `.env` files with real credentials

### 2. Use Environment-Specific Values
```bash
# Development - use mock services
SYNC_SERVER_URL=http://localhost:8443/graphql
VITE_ENABLE_MOCK_SERIAL=true

# Production - use real services
SYNC_SERVER_URL=https://api.smartmill.com/graphql
VITE_ENABLE_MOCK_SERIAL=false
```

### 3. Secure Communication
```bash
# Always use HTTPS in production
SYNC_SERVER_URL=https://api.yourcompany.com/graphql

# Enable security headers
VITE_ENABLE_CSP=true
VITE_XSS_PROTECTION=true
```

## 🧪 Testing Configuration

### Test with Different Values
```bash
# Test faster update intervals
VITE_WEIGHT_UPDATE_INTERVAL=500
VITE_SYNC_STATUS_UPDATE_INTERVAL=5000

# Test shorter session timeout
VITE_AUTH_SESSION_TIMEOUT=60000  # 1 minute
```

### Mock Different Scenarios
```bash
# Test with no sync server
SYNC_ENABLED=false

# Test with different mock weights
MOCK_SERIAL_MIN_WEIGHT=1000
MOCK_SERIAL_MAX_WEIGHT=5000
MOCK_SERIAL_VARIANCE=10
```

## 🔍 Debugging Configuration

### Backend Debug Logging
The Go backend will log configuration loading:
```bash
# Check console output for:
# - Environment variable loading status
# - Configuration validation errors
# - Applied configuration values
```

### Frontend Debug Logging
The React frontend logs configuration in development mode:
```bash
# Open browser console (F12) to see:
# - Loaded configuration values
# - Validation warnings
# - Feature flag status
```

### Configuration Validation
The frontend includes automatic validation:
```javascript
// In browser console, check for validation warnings
⚠️ Configuration Validation Warnings
- API timeout should be at least 1000ms
- Warning timeout should be less than session timeout
```

## 📋 Environment Variable Priority

1. **System Environment Variables** (highest priority)
2. **.env file** (loaded by godotenv)
3. **Default values** (in code)

This means you can override `.env` values by setting system environment variables.

## 🚀 Deployment Examples

### Docker Deployment
```dockerfile
# Dockerfile
ENV APP_ENV=production
ENV DB_PATH=/app/data/smartmill.db
ENV SYNC_SERVER_URL=https://api.smartmill.com/graphql
```

### Windows Service
```cmd
# Set environment variables
set APP_ENV=production
set DB_PATH=C:\ProgramData\SmartMillScale\data\smartmill.db
set SYNC_SERVER_URL=https://api.smartmill.com/graphql

# Run application
SmartMillScale.exe
```

### Linux Systemd
```ini
# /etc/systemd/system/smartmill-scale.service
[Service]
Environment=APP_ENV=production
Environment=DB_PATH=/opt/smartmill/data/smartmill.db
Environment=SYNC_SERVER_URL=https://api.smartmill.com/graphql
ExecStart=/opt/smartmill/bin/SmartMillScale
```

## 🔄 Configuration Hot Reload

### Frontend
Configuration changes require a frontend restart:
```bash
cd desktop-app/frontend
npm run dev  # Restart development server
```

### Backend
Backend configuration is loaded at startup and requires application restart:
```bash
cd desktop-app
wails dev  # Restart application
```

## 🛠️ Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Check that `.env` file exists
   - Verify file permissions
   - Check console logs for loading errors

2. **Configuration validation errors**
   - Review the validation warnings in console
   - Check data types (numbers vs strings)
   - Verify duration formats (use `1m`, `5s`, `1h`)

3. **Feature flags not working**
   - Ensure values are lowercase (`true`/`false`)
   - Check spelling of variable names
   - Restart application after changes

### Getting Help

1. Check browser console for frontend configuration logs
2. Review terminal output for backend configuration status
3. Use configuration validation to identify issues
4. Compare with `.env.example` for correct format

---

**Note**: Always restart the application after changing environment configuration to ensure changes take effect.