# Quick Start Guide - Smart Mill Scale

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
cd desktop-app/frontend
npm install

# Back to desktop-app root
cd ..

# Install Go dependencies
go mod tidy
```

### Step 2: Test the UI (Development Mode)

Untuk melihat UI yang sudah dibuat (dengan mock data):

```bash
cd desktop-app
wails3 dev
```

Aplikasi akan terbuka dan Anda akan melihat:
- ⚖️ Weighing panel dengan simulasi berat yang naik-turun
- 🔄 Sync status panel dengan statistik
- 📋 Recent weighings list

### Step 3: Understanding the Code Structure

**Komponen Utama:**

1. **Database Models** (`internal/database/models.go`)
   - Timbangan, SyncQueue, SyncHistory, DeviceInfo

2. **Serial Communication** (`internal/serial/serial.go`)
   - Real dan Mock serial readers

3. **Business Logic** (`internal/service/weighing.go`)
   - RecordWeighing dengan transactional outbox pattern

4. **React UI** (`frontend/src/`)
   - components/: WeighingPanel, SyncStatus, RecentWeighings
   - store/: Zustand state management

### Step 4: Next Implementation Tasks

**Priority 1: Sync Worker**
Create `desktop-app/internal/sync/worker.go`:

```go
package sync

import (
    "time"
    "sync"
    "gorm.io/gorm"
)

type Worker struct {
    db       *gorm.DB
    client   *GraphQLClient
    interval time.Duration
    stopCh   chan struct{}
    wg       sync.WaitGroup
}

func NewWorker(db *gorm.DB, config Config) *Worker {
    return &Worker{
        db:       db,
        interval: config.SyncInterval,
        stopCh:   make(chan struct{}),
    }
}

func (w *Worker) Start() {
    w.wg.Add(1)
    go func() {
        defer w.wg.Done()
        ticker := time.NewTicker(w.interval)
        defer ticker.Stop()

        for {
            select {
            case <-ticker.C:
                w.processQueue()
            case <-w.stopCh:
                return
            }
        }
    }()
}

func (w *Worker) Stop() {
    close(w.stopCh)
    w.wg.Wait()
}

func (w *Worker) processQueue() {
    // TODO: Implement queue processing
    // 1. Fetch pending items
    // 2. Send to server
    // 3. Update status
}
```

**Priority 2: GraphQL Client**
Create `desktop-app/internal/sync/client.go`:

```go
package sync

import (
    "bytes"
    "encoding/json"
    "net/http"
    "time"
)

type GraphQLClient struct {
    serverURL string
    deviceID  string
    apiKey    string
    client    *http.Client
}

func NewGraphQLClient(serverURL, deviceID, apiKey string) *GraphQLClient {
    return &GraphQLClient{
        serverURL: serverURL,
        deviceID:  deviceID,
        apiKey:    apiKey,
        client: &http.Client{
            Timeout: 30 * time.Second,
        },
    }
}

func (c *GraphQLClient) BatchSyncWeighingData(records []TimbanganData) (*SyncResponse, error) {
    // TODO: Implement GraphQL mutation
    return nil, nil
}
```

**Priority 3: Wails Integration**
Update `desktop-app/app.go`:

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
    "github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
    "github.com/yourusername/gosmartmillscale/desktop-app/internal/serial"
)

type App struct {
    ctx             context.Context
    weighingService *service.WeighingService
    serialReader    *serial.SerialReader
}

func (a *App) Startup(ctx context.Context) {
    a.ctx = ctx

    // Initialize database
    if err := database.InitDatabase("./data/smartmill.db"); err != nil {
        log.Fatal("Failed to initialize database:", err)
    }

    // Load config (TODO: implement config loading)
    config := loadDefaultConfig()

    // Initialize weighing service
    a.weighingService = service.NewWeighingService(database.GetDB(), config)

    // Start serial reader (use mock for now)
    a.serialReader = serial.NewMockSerialReader(config.Weighing)
    if err := a.serialReader.Start(); err != nil {
        log.Println("Failed to start serial reader:", err)
    }

    log.Println("App started successfully")
}

func (a *App) Shutdown(ctx context.Context) {
    log.Println("App shutting down...")

    if a.serialReader != nil {
        a.serialReader.Stop()
    }

    database.CloseDatabase()
}

// Expose methods to frontend
func (a *App) RecordWeighing(vehicleNumber string, beratKotor, beratBersih int) (map[string]interface{}, error) {
    record, err := a.weighingService.RecordWeighing(vehicleNumber, beratKotor, beratBersih)
    if err != nil {
        return nil, err
    }

    return map[string]interface{}{
        "idLocal":        record.IDLocal.String(),
        "nomorKendaraan": record.NomorKendaraan,
        "beratKotor":     record.BeratKotor,
        "beratBersih":    record.BeratBersih,
        "tanggal":        record.Tanggal,
        "statusSync":     record.StatusSync,
    }, nil
}

func (a *App) GetSyncStats() (map[string]int, error) {
    return a.weighingService.GetSyncStats()
}

func (a *App) GetRecentWeighings(limit int) ([]map[string]interface{}, error) {
    records, err := a.weighingService.GetRecentWeighings(limit)
    if err != nil {
        return nil, err
    }

    // Convert to maps for JSON
    result := make([]map[string]interface{}, len(records))
    for i, r := range records {
        result[i] = map[string]interface{}{
            "idLocal":        r.IDLocal.String(),
            "nomorKendaraan": r.NomorKendaraan,
            "beratKotor":     r.BeratKotor,
            "beratBersih":    r.BeratBersih,
            "tanggal":        r.Tanggal,
            "statusSync":     r.StatusSync,
            "syncedAt":       r.SyncedAt,
            "errorMessage":   r.ErrorMessage,
        }
    }

    return result, nil
}

func loadDefaultConfig() types.AppConfig {
    // TODO: Load from file
    return types.AppConfig{
        DeviceID:     uuid.New(),
        DeviceName:   "Timbangan Test",
        DatabasePath: "./data/smartmill.db",
        Weighing:     types.DefaultWeighingConfig(),
        Sync:         types.DefaultSyncConfig(),
    }
}
```

### Step 5: Build for Production

```bash
cd desktop-app

# Build executable
wails3 build

# Output akan ada di desktop-app/build/bin/
```

### Step 6: Testing Serial Port

**Dengan Mock (Tanpa Hardware):**
```go
// app.go
a.serialReader = serial.NewMockSerialReader(config.Weighing)
```

**Dengan Real Hardware:**
```go
// app.go
a.serialReader = serial.NewSerialReader(config.Weighing)
```

**List Available Ports:**
```go
ports := serial.ListAvailablePorts()
fmt.Println("Available COM ports:", ports)
```

---

## 📝 Useful Commands

```bash
# Development mode (hot reload)
wails3 dev

# Build production
wails3 build

# Generate bindings (after adding new Go methods)
wails3 generate

# Clean build
wails3 clean

# Update frontend dependencies
cd frontend && npm update
```

---

## 🐛 Troubleshooting

### UI tidak muncul
- Check console errors di DevTools (F12)
- Verify frontend dependencies: `cd frontend && npm install`

### Database error
- Check database file exists: `./data/smartmill.db`
- Check permissions
- Try deleting database dan restart (akan auto-create)

### Serial port tidak terhubung
- Use mock reader untuk testing
- Check COM port name (Windows: COM1, COM2, etc.)
- Verify baudrate matches your hardware

### Build failed
- Run `go mod tidy` di desktop-app
- Run `npm install` di frontend
- Check Go version >= 1.22
- Check Node version >= 18

---

## 🎯 What's Working Now

✅ Database models dengan enhancement
✅ Serial port communication (real & mock)
✅ Weighing service dengan outbox pattern
✅ React UI components lengkap
✅ State management dengan Zustand
✅ Shared types & utilities
✅ Idempotency keys & signatures

## 🚧 What Needs Implementation

🔲 Sync worker background job
🔲 GraphQL client
🔲 Wails integration (connect Go ↔ React)
🔲 Configuration management
🔲 Device registration
🔲 Settings UI

---

## 📖 Documentation

- **DEVELOPMENT.md** - Detailed development guide
- **README.md** - Project overview
- Code comments - Extensive inline documentation

---

**Happy Coding! 🚀**

Untuk pertanyaan atau bantuan, refer ke DEVELOPMENT.md atau review kode yang sudah diimplementasi.
