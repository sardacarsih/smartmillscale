# Smart Mill Scale

Desktop weighing scale management application built with **Wails v2** (Go + React). Offline-first system with SQLite database and cloud synchronization.

## Tech Stack

- **Desktop Framework**: Wails v2
- **Backend**: Go 1.25.1, SQLite (GORM), CGO-free driver (modernc.org/sqlite)
- **Frontend**: React 18.3.1, Zustand, TailwindCSS
- **Build**: Vite (frontend), Wails (desktop)

## Features

- Real-time weight monitoring via serial port communication
- PKS (Palm Oil Mill System) master data management
- Role-based access control (Admin, Supervisor, Timbangan, Grading)
- Offline-first with background cloud synchronization
- Transactional outbox pattern for reliable sync
- Exponential backoff retry with batch processing
- Comprehensive audit logging
- Mock mode for development without hardware
- Dark theme modern UI

## Quick Start

### Prerequisites

- [Go 1.25+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation)

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### Setup

```bash
# Backend dependencies
cd desktop-app
go mod tidy

# Frontend dependencies
cd frontend
npm install

# Shared module
cd ../../shared
go mod tidy
```

### Development

```bash
# Full-stack (Go + React)
cd desktop-app
wails dev

# Frontend only (faster, with mock data)
cd desktop-app/frontend
npm run dev
```

### Production Build

```bash
cd desktop-app
wails build
```

Output: `build/bin/` (standalone Windows executable)

## Project Structure

```
gosmartmillscale/
├── desktop-app/           # Main Wails application
│   ├── internal/
│   │   ├── auth/          # Authentication & RBAC
│   │   ├── config/        # Configuration management
│   │   ├── database/      # SQLite models & migrations
│   │   ├── serial/        # Serial port communication
│   │   ├── service/       # Business logic
│   │   └── sync/          # Background synchronization
│   ├── frontend/          # React application
│   │   └── src/
│   │       ├── features/  # Feature modules (auth, weighing, dashboard, audit)
│   │       ├── components/# Shared UI components
│   │       └── stores/    # Zustand state management
│   ├── app.go             # Application orchestrator
│   └── main.go            # Wails entry point
├── shared/                # Common types and utilities
└── backend/               # Additional backend services
```

## Architecture

### Data Flow

```
Serial Port -> Go Channels -> SQLite -> Sync Queue -> Cloud API
                                |
                         Wails Bindings -> React State -> UI
```

### Offline-First Design

- SQLite as primary data store; all operations work offline
- Background sync worker with exponential backoff retry
- UUID-based conflict resolution
- Transactional outbox for reliable queue population

## Configuration

Auto-generated on first run at `%LOCALAPPDATA%\SmartMillScale\config.json` with defaults for device info, serial port, and sync settings.

## Testing

### Mock Mode

Application automatically uses mock serial reader when hardware is unavailable, simulating weight fluctuations and vehicle cycling.

### Default Users (Development)

| Username   | Password       | Role       |
|------------|----------------|------------|
| admin      | admin123       | Admin      |
| supervisor | supervisor123  | Supervisor |
| operator   | operator123    | Timbangan  |
| grading    | grading123     | Grading    |

### Run Tests

```bash
# Backend
cd desktop-app && go test ./...

# Frontend
cd desktop-app/frontend && npm test
```

## License

Proprietary - All rights reserved
