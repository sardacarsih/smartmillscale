# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Mill Scale is a desktop weighing scale management application built with Wails v2, combining a Go backend with React frontend. It's an offline-first system with SQLite database and cloud synchronization capabilities.

## Key Commands

### Development Setup
```bash
# Install Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Clone and setup
git clone <repository>
cd gosmartmillscale

# Setup backend dependencies
cd desktop-app
go mod tidy

# Setup frontend dependencies
cd frontend
npm install

# Install shared module dependencies
cd ../../shared
go mod tidy
```

### Running the Application
```bash
cd desktop-app

# Development mode with live reload
wails dev

# Build for production
wails build

# Frontend development only
cd frontend && npm run dev
```

### Development Workflow & Hot Reload

The application is configured with **Hot Module Replacement (HMR)** for optimal development experience:

#### Frontend-Only Development (Recommended for UI work)
```bash
cd desktop-app/frontend
npm run dev
```
- **Fastest development cycle** - changes appear instantly
- **HMR enabled** - React components reload without full page refresh
- **State preservation** - Zustand stores maintain state across HMR
- **Mock data** - Frontend has fallback implementations for all backend methods
- Open browser to `http://localhost:34115`

**Use this mode when:**
- Working on UI/UX changes
- Styling with TailwindCSS
- Component development
- Frontend logic that doesn't require backend integration

#### Full-Stack Development (For backend integration)
```bash
cd desktop-app
wails dev
```
- **Complete integration** - Frontend + Backend + Database
- **Auto-reload frontend** - Vite HMR works with Wails
- **Manual backend restart** - Go changes require dev server restart (Wails v2 limitation)
- **Debounced rebuilds** - 500ms delay prevents rapid rebuild cycles

**Use this mode when:**
- Testing Wails bindings
- Working on Go backend code
- Database operations
- Serial port communication
- End-to-end feature testing

#### Browser DevTools Settings (Important!)
To ensure HMR works correctly:
1. Open Chrome/Edge DevTools (F12)
2. Go to Settings (⚙️) → Preferences → Network
3. Check **"Disable cache (while DevTools is open)"**
4. Keep DevTools open during development

#### Hot Reload Indicators
When HMR is working correctly, you'll see console messages:
```
🔥 HMR: Hot reloading...
🔥 HMR: [Store name] store reloaded
[vite] hot updated: /src/features/...
```

#### Troubleshooting Hot Reload

**Frontend changes not appearing:**
1. Check that Vite dev server is running on port 34115
2. Ensure DevTools cache is disabled
3. Check browser console for HMR errors
4. Try hard refresh (Ctrl+Shift+R)

**Backend changes not applying:**
1. Stop `wails dev` (Ctrl+C)
2. Restart: `wails dev`
3. Backend hot reload is not supported in Wails v2

**State lost after reload:**
- Zustand stores should maintain state during HMR
- If state is lost, check store implementation for HMR acceptance block
- Use persist middleware for critical state

**Slow HMR:**
- Check `vite.config.js` warmup configuration
- Ensure `watch.usePolling` is false (unless on network drive)
- Clear `node_modules/.vite` cache: `rm -rf frontend/node_modules/.vite`

### Testing
```bash
# Backend tests
cd desktop-app && go test ./...

# Frontend tests
cd frontend && npm test

# Build verification
wails build -debug
```

## Architecture Overview

### Technology Stack
- **Desktop Framework**: Wails v2 (Go + React)
- **Backend**: Go 1.25.1 with SQLite (GORM)
- **Frontend**: React 18.3.1, Zustand, TailwindCSS
- **Database**: SQLite with offline-first design
- **Build**: Vite (frontend), Wails (desktop app)

### Project Structure
```
gosmartmillscale/
├── desktop-app/           # Main Wails application
│   ├── internal/         # Backend modules
│   │   ├── auth/        # Authentication & authorization
│   │   ├── config/      # Configuration management
│   │   ├── database/    # SQLite models & migrations
│   │   ├── serial/      # Serial port communication
│   │   ├── service/     # Business logic layer
│   │   └── sync/        # Background synchronization
│   ├── frontend/        # React application
│   │   └── src/
│   │       ├── features/    # Feature-based organization
│   │       │   ├── auth/    # Login, setup, user management
│   │       │   ├── weighing/ # Weighing operations
│   │       │   ├── dashboard/ # Status monitoring
│   │       │   └── audit/   # Activity logging
│   │       ├── components/  # Shared UI components
│   │       └── stores/      # Zustand state management
│   ├── app.go            # Main application orchestrator
│   ├── main.go           # Wails entry point
│   └── wails.json        # Wails configuration
├── shared/               # Common types and utilities
│   ├── types/           # Shared data structures
│   └── utils/           # Utility functions
└── backend/             # Additional backend services
```

## Core Components

### 1. Database Layer (SQLite + GORM)
- **Location**: `desktop-app/data/smartmill.db` (Standardized location)
- **Code**: `desktop-app/internal/database/`
- **Models**: `Timbangan`, `SyncQueue`, `SyncHistory`, `DeviceInfo`, `Users`, `AuditLogs`
- **Pattern**: Offline-first with transactional outbox for sync reliability
- **Features**: Auto-migration, optimized indexes, UUID-based unique identifiers
- **Configuration**: Uses CGO-free SQLite driver with modernc.org/sqlite

### 2. Authentication System
- **Location**: `desktop-app/internal/auth/`
- **Features**: Role-based access control (ADMIN, SUPERVISOR, TIMBANGAN, GRADING)
- **Security**: bcrypt password hashing, session management, audit logging
- **Frontend**: Login page, setup wizard, lock screen for session timeout

### 3. Serial Communication
- **Location**: `desktop-app/internal/serial/`
- **Features**: Real-time weight monitoring, automatic reconnection, mock mode
- **Protocol**: Configurable for different scale manufacturers
- **Fallback**: Mock reader for development without hardware

### 4. Synchronization Worker
- **Location**: `desktop-app/internal/sync/`
- **Pattern**: Background worker with exponential backoff retry
- **Features**: Batch processing, health monitoring, idempotency prevention
- **Queue**: Transactional outbox pattern for reliability

### 5. React Frontend
- **State Management**: Zustand stores for auth, weighing, and notifications
- **Features**: Real-time updates, responsive design, dark theme
- **Development**: Fallback implementations allow frontend development without backend

## Key Development Patterns

### Offline-First Architecture
- Local SQLite database serves as primary data store
- All operations work offline with background synchronization
- Conflict resolution through UUID-based unique identifiers
- Outbox pattern ensures reliable sync queue population

### Real-Time Data Flow
1. Serial port → Go channels → Database → Sync Queue
2. Database → Wails bindings → React state → UI updates
3. User actions → Wails methods → Service layer → Database

### Authentication Flow
1. Initial setup wizard creates admin user
2. Role-based access controls feature availability
3. Session timeout with automatic lock screen
4. Comprehensive audit logging for all activities

### Development Fallbacks
- Frontend includes mock implementations for all backend methods
- Allows frontend development without Go backend running
- Uses localStorage for persistence in development mode

## Important Files

### Backend
- `desktop-app/app.go` - Main application orchestrator (894 lines)
- `desktop-app/internal/database/models.go` - Database models
- `desktop-app/internal/auth/service.go` - Authentication logic
- `desktop-app/internal/service/weighing.go` - Core weighing operations
- `desktop-app/internal/sync/worker.go` - Background synchronization

### Frontend
- `desktop-app/frontend/src/features/auth/useAuthStore.js` - Auth state management
- `desktop-app/frontend/src/features/weighing/useWeighingStore.js` - Weighing state
- `desktop-app/frontend/src/features/weighing/WeighingPanel.jsx` - Main interface

### Configuration
- `desktop-app/wails.json` - Wails build configuration
- `desktop-app/go.mod` - Go dependencies with shared module replacement
- `desktop-app/frontend/package.json` - Frontend dependencies

## Testing Strategy

### Mock Mode
- Application automatically uses mock serial reader when hardware unavailable
- Simulates weight fluctuations and vehicle cycling
- Enables testing without physical scale hardware

### Development Mode
- Frontend includes comprehensive fallback implementations
- Uses localStorage for data persistence during development
- Allows independent frontend/backend development

### Database Testing
- SQLite database at `desktop-app/data/smartmill.db` can be deleted for clean slate testing
- Auto-recreates with proper schema on application start
- Test data persists through application restarts
- Default users automatically created: admin/admin123, supervisor/supervisor123, operator/operator123, grading/grading123

## Build and Deployment

### Development Build
```bash
cd desktop-app
wails dev
```
- Starts both frontend and backend in development mode
- Enables hot reload for React components
- Provides extensive logging and error details

### Production Build
```bash
cd desktop-app
wails build
```
- Creates standalone executable in `build/bin/`
- Embeds frontend assets in application
- Optimized for Windows deployment

### Configuration Management
- Auto-generated config file at `%LOCALAPPDATA%\SmartMillScale\config.json`
- Default values provided for all settings
- Runtime configuration updates supported

## Security Considerations

- SQL injection prevention through parameterized queries
- Password hashing with bcrypt for authentication
- Session timeout and activity-based refresh
- Role-based access control for all features
- Comprehensive audit logging for sensitive operations
- Input validation and sanitization throughout

## Performance Optimizations

- SQLite connection pooling (1 writer at a time)
- Composite database indexes for common queries
- Batch processing for synchronization operations
- Efficient real-time data streaming with Go channels
- React component optimization with proper state management
- Exponential backoff for retry operations

This architecture provides a robust foundation for offline-first desktop application development with enterprise-grade features including authentication, synchronization, and comprehensive audit capabilities.