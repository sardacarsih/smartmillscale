# Development Guide - Smart Mill Scale Desktop App

## 🎉 Project Status

Aplikasi desktop telah berhasil di-setup dengan arsitektur yang solid berdasarkan rekomendasi dari software architect!

---

## ✅ Komponen Yang Sudah Diimplementasi

### 1. **Project Structure**
```
gosmartmillscale/
├── desktop-app/
│   ├── internal/
│   │   ├── database/       ✅ SQLite models & migrations
│   │   ├── serial/         ✅ Serial port communication
│   │   └── service/        ✅ Business logic layer
│   ├── frontend/
│   │   └── src/
│   │       ├── components/ ✅ React UI components
│   │       └── store/      ✅ Zustand state management
│   ├── main.go             ✅ Wails entry point
│   └── app.go              ✅ App struct
└── shared/
    ├── types/              ✅ Common data models
    └── utils/              ✅ Utilities (idempotency, validation, signature)
```

### 2. **Database Layer (SQLite)** ✅
**File:** `desktop-app/internal/database/`

**Models:**
- `Timbangan` - Weighing records dengan semua enhancement:
  - Idempotency keys untuk duplicate prevention
  - Sync status tracking
  - Device ID untuk multi-device support
  - Timestamps lengkap (created_at, updated_at, synced_at)

- `SyncQueue` - Transactional outbox pattern:
  - Retry logic dengan max retries
  - Payload JSON storage
  - Status tracking (PENDING → PROCESSING → SUCCESS/FAILED)

- `SyncHistory` - Audit log:
  - Record setiap sync attempt
  - Performance metrics (duration_ms)
  - Request/response logging

- `DeviceInfo` - Device configuration

**Features:**
- Auto-migration dengan GORM
- Optimized indexes untuk query performance
- Unique constraints untuk data integrity
- Transaction-safe operations

### 3. **Serial Port Communication** ✅
**File:** `desktop-app/internal/serial/`

**Features:**
- ✅ Real serial reader dengan `tarm/serial`
- ✅ Auto-reconnection dengan exponential backoff
- ✅ Buffered reading untuk incomplete data
- ✅ Connection health monitoring
- ✅ Mock serial reader untuk testing tanpa hardware
- ✅ Parsing weight data dari berbagai format
- ✅ Stability detection

**Usage:**
```go
// Real hardware
reader := serial.NewSerialReader(config)
reader.Start()

// Mock untuk testing
mockReader := serial.NewMockSerialReader(config)
mockReader.Start()

// Listen to data
for data := range reader.GetDataChannel() {
    fmt.Printf("Weight: %.2f kg, Stable: %v\n",
        float64(data.Weight)/100, data.Stable)
}
```

### 4. **Weighing Service** ✅
**File:** `desktop-app/internal/service/weighing.go`

**Transactional Outbox Pattern:**
```go
// Atomic write ke timbangan + sync_queue
func (s *WeighingService) RecordWeighing(
    nomorKendaraan string,
    beratKotor int,
    beratBersih int,
) (*database.Timbangan, error)
```

**Features:**
- ✅ Atomic transaction (timbangan + sync_queue)
- ✅ Automatic idempotency key generation
- ✅ Input validation
- ✅ Sync status management
- ✅ CRUD operations
- ✅ Statistics & reporting

### 5. **Shared Types & Utilities** ✅
**Files:** `shared/types/` dan `shared/utils/`

**Types:**
- `TimbanganData` - Portable weighing data
- `SyncRequest/SyncResponse` - Network contracts
- `WeighingConfig` - Serial port configuration
- `SyncConfig` - Sync worker configuration

**Utilities:**
- ✅ `GenerateIdempotencyKey()` - Format: `DEVICE_ID:TIMESTAMP:HASH`
- ✅ `SignPayload()` - HMAC-SHA256 request signing
- ✅ `VerifySignature()` - Signature verification
- ✅ `ValidateTimestamp()` - Replay attack prevention
- ✅ `ValidateTimbanganData()` - Input validation
- ✅ `HashAPIKey()` - SHA-256 API key hashing

### 6. **React UI Components** ✅
**Files:** `desktop-app/frontend/src/`

**State Management:**
- Zustand store (`useWeighingStore.js`)
- Real-time weight updates
- Sync status tracking
- Notification management

**Components:**
1. **WeighingPanel** - Main penimbangan interface
   - Real-time weight display (50 kg format)
   - Stability indicator
   - Vehicle number input
   - Record button dengan validasi
   - Connection status indicator

2. **SyncStatus** - Sinkronisasi monitoring
   - Progress bar
   - Statistics grid (Total, Synced, Pending, Failed)
   - Manual sync button
   - Last sync timestamp
   - Warning untuk pending/failed items

3. **RecentWeighings** - History list
   - 10 penimbangan terbaru
   - Sync status badges
   - Formatted dates dan weights
   - Error messages (jika ada)

4. **Notification** - Toast notifications
   - Auto-dismiss (5 detik)
   - Success/Error/Warning/Info types
   - Animated slide-in

**Features:**
- ✅ Modern UI dengan TailwindCSS
- ✅ Dark theme
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Loading states
- ✅ Error handling
- ✅ Custom animations

---

## 🚧 Yang Masih Perlu Diimplementasi

### 1. **Background Sync Worker** (Prioritas Tinggi)
**File yang perlu dibuat:** `desktop-app/internal/sync/worker.go`

**Requirements:**
- Goroutine worker yang berjalan di background
- Poll `sync_queue` setiap 5 menit
- Exponential backoff untuk retry (1s, 2s, 4s, 8s, 16s, max 60s)
- Batch processing (50 records per batch)
- Graceful shutdown
- SELECT FOR UPDATE untuk prevent race conditions

**Pseudocode:**
```go
type SyncWorker struct {
    db       *gorm.DB
    client   *GraphQLClient
    interval time.Duration
    stopCh   chan struct{}
}

func (w *SyncWorker) Start() {
    go func() {
        ticker := time.NewTicker(5 * time.Minute)
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

func (w *SyncWorker) processQueue() {
    // 1. SELECT pending items dengan locking
    // 2. Update status ke PROCESSING
    // 3. Send GraphQL mutation
    // 4. Update status ke SUCCESS/FAILED
    // 5. Record ke sync_history
}
```

### 2. **GraphQL Client** (Prioritas Tinggi)
**File yang perlu dibuat:** `desktop-app/internal/sync/client.go`

**Requirements:**
- HTTP client dengan TLS 1.3
- Request signing (HMAC-SHA256)
- Device authentication (headers)
- Batch sync mutation
- Error handling & classification
- Retry logic

**Pseudocode:**
```go
type GraphQLClient struct {
    serverURL  string
    deviceID   uuid.UUID
    apiKey     string
    httpClient *http.Client
}

func (c *GraphQLClient) BatchSyncWeighingData(
    records []types.TimbanganData,
) (*types.SyncResponse, error) {
    // 1. Marshal request payload
    // 2. Generate signature
    // 3. Add auth headers
    // 4. Execute GraphQL mutation
    // 5. Parse response
}
```

**GraphQL Mutation:**
```graphql
mutation BatchSyncWeighingData($input: BatchSyncInput!) {
  batchSyncWeighingData(input: $input) {
    totalReceived
    successCount
    failedCount
    results {
      idLocal
      idPusat
      status
      error
    }
    serverTime
  }
}
```

### 3. **Integration dengan Wails** (Prioritas Tinggi)
**File yang perlu diupdate:** `desktop-app/app.go`

**Requirements:**
- Integrate database initialization
- Start serial port reader
- Start sync worker
- Expose Go methods untuk React:
  - `RecordWeighing(vehicleNumber, beratKotor, beratBersih)`
  - `GetSyncStats()`
  - `GetRecentWeighings(limit)`
  - `TriggerManualSync()`
  - `GetSerialPorts()`
  - `ConnectSerial(port)`

**Example:**
```go
type App struct {
    ctx             context.Context
    db              *gorm.DB
    weighingService *service.WeighingService
    serialReader    *serial.SerialReader
    syncWorker      *sync.Worker
}

func (a *App) Startup(ctx context.Context) {
    a.ctx = ctx

    // Initialize database
    database.InitDatabase("./data/smartmill.db")
    a.db = database.GetDB()

    // Initialize services
    config := loadConfig()
    a.weighingService = service.NewWeighingService(a.db, config)

    // Start serial reader
    a.serialReader = serial.NewSerialReader(config.Weighing)
    a.serialReader.Start()

    // Start sync worker
    a.syncWorker = sync.NewWorker(a.db, config)
    a.syncWorker.Start()

    // Listen to serial data and update UI
    go a.listenSerialData()
}

func (a *App) RecordWeighing(vehicleNumber string, beratKotor, beratBersih int) (map[string]interface{}, error) {
    record, err := a.weighingService.RecordWeighing(vehicleNumber, beratKotor, beratBersih)
    if err != nil {
        return nil, err
    }

    // Convert to map for JSON serialization
    return map[string]interface{}{
        "idLocal": record.IDLocal.String(),
        "nomorKendaraan": record.NomorKendaraan,
        "beratKotor": record.BeratKotor,
        "beratBersih": record.BeratBersih,
        "tanggal": record.Tanggal,
        "statusSync": record.StatusSync,
    }, nil
}
```

### 4. **Configuration Management**
**File yang perlu dibuat:** `desktop-app/internal/config/config.go`

**Requirements:**
- Load dari file JSON/YAML
- Default configuration
- Device registration
- API key storage (Windows Credential Manager)
- Validation

**Example config.json:**
```json
{
  "deviceId": "uuid-here",
  "deviceName": "Timbangan Gudang A",
  "location": "Jakarta",
  "databasePath": "./data/smartmill.db",
  "weighing": {
    "comPort": "COM1",
    "baudRate": 9600,
    "dataBits": 8,
    "stopBits": 1,
    "parity": "N"
  },
  "sync": {
    "serverUrl": "https://your-server.com/graphql",
    "syncInterval": "5m",
    "maxRetries": 5,
    "batchSize": 50
  }
}
```

### 5. **Additional UI Features**
- Settings/Configuration panel
- Manual sync interface dengan filters
- Export data ke CSV/Excel
- Detailed weighing history dengan search & filter
- Device status dashboard

---

## 🚀 Cara Development

### Prerequisites
```bash
# Install Go 1.22+
# Install Node.js 18+
# Install Wails CLI
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

### Setup Development Environment
```bash
# Clone repository
cd gosmartmillscale

# Install frontend dependencies
cd desktop-app/frontend
npm install

# Install Go dependencies
cd ..
go mod tidy

# Install shared dependencies
cd ../shared
go mod tidy
```

### Run Development Server
```bash
cd desktop-app

# Development mode (live reload)
wails3 dev

# Or build for production
wails3 build
```

### Testing Serial Port (Mock)
Edit `app.go` untuk menggunakan `MockSerialReader`:
```go
// Development mode - use mock
a.serialReader = serial.NewMockSerialReader(config.Weighing)
```

---

## 📋 Next Steps

### Immediate (This Week)
1. ✅ **DONE** - Project setup & architecture
2. ✅ **DONE** - Database models & migrations
3. ✅ **DONE** - Serial port communication
4. ✅ **DONE** - Weighing service dengan outbox pattern
5. ✅ **DONE** - React UI components
6. **TODO** - Implement sync worker
7. **TODO** - Implement GraphQL client
8. **TODO** - Integration dengan Wails

### Short-term (Next Week)
1. Configuration management
2. Device registration flow
3. Settings UI
4. Manual sync interface
5. Error handling & logging

### Medium-term
1. Testing (unit & integration)
2. Windows installer
3. Documentation
4. Deployment guide

---

## 🔧 Architecture Highlights

### Offline-First Design
- SQLite sebagai source of truth
- Sync queue untuk reliable sync
- Idempotency keys untuk duplicate prevention

### Reliability
- Transactional outbox pattern
- Exponential backoff retry
- Connection health monitoring
- Graceful error handling

### Security
- HMAC request signing
- Device authentication
- API key hashing
- Timestamp validation (replay attack prevention)

### Performance
- Optimized database indexes
- Batch sync operations
- Connection pooling
- Background workers

---

## 📚 Key Technologies

- **Backend:** Go 1.22+
- **Desktop Framework:** Wails v3
- **Database:** SQLite (GORM)
- **Frontend:** React 18 + Vite
- **Styling:** TailwindCSS
- **State:** Zustand
- **Data Fetching:** TanStack Query
- **Serial Communication:** tarm/serial

---

## 🎯 Critical Success Factors

1. **Data Integrity**
   - ✅ Unique constraints
   - ✅ Idempotency keys
   - ✅ Transactional writes

2. **Sync Reliability**
   - ✅ Outbox pattern
   - 🚧 Exponential backoff (need to implement)
   - 🚧 Error classification (need to implement)

3. **User Experience**
   - ✅ Real-time weight display
   - ✅ Clear sync status
   - ✅ Error notifications
   - ✅ Offline capability

4. **Security**
   - ✅ Request signing
   - ✅ API key hashing
   - 🚧 TLS 1.3 (need to implement)
   - 🚧 Device authentication (need to implement)

---

## 💡 Tips & Best Practices

1. **Development:**
   - Use mock serial reader untuk testing tanpa hardware
   - Test offline scenarios dengan network disconnect
   - Validate idempotency dengan duplicate requests

2. **Database:**
   - Run VACUUM periodically untuk optimize SQLite
   - Monitor database size
   - Archive old synced records

3. **Sync:**
   - Test dengan server downtime scenarios
   - Monitor sync queue size
   - Log sync failures untuk debugging

4. **UI:**
   - Show loading states
   - Handle offline gracefully
   - Provide clear error messages

---

## 📞 Support

Jika ada pertanyaan atau butuh bantuan dengan implementasi:
1. Review architectural analysis di hasil agent
2. Check kode yang sudah diimplementasi
3. Refer ke dokumentasi Wails: https://wails.io/docs/
4. Review GORM docs: https://gorm.io/docs/

---

**Status:** Foundation Complete ✅
**Next Priority:** Sync Worker + GraphQL Client 🚀
**Target:** Production-ready dalam 2-3 minggu
