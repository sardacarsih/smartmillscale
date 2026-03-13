# Arsitektur Komunikasi Serial Port - Smart Mill Scale

Dokumen ini menjelaskan secara detail bagaimana alur komunikasi data dari timbangan digital (Hardware) hingga ke tampilan antarmuka pengguna (Frontend).

## 1. Diagram Alur Data (High-Level Overview)

```mermaid
flowchart TB
    Scale[⚖️ Timbangan Digital<br/>Hardware]
    
    subgraph Backend ["🔷 Go Backend Layer"]
        direction TB
        SerialPort[Serial Port<br/>COM1-COM20]
        Reader[SerialReader Service<br/>readLoop goroutine]
        Parser[Data Parser<br/>parseLine]
        StabilityChecker[Stability Checker<br/>checkStability]
        Controller[WeightMonitor<br/>Controller]
        Stream[Weight Event Stream<br/>500ms ticker]
        Wails[Wails Runtime<br/>EventsEmit]
    end
    
    subgraph Frontend ["🔶 React Frontend Layer"]
        direction TB
        EventBus[Event Coordinator<br/>Singleton]
        Hook[useWeightMonitoring<br/>Custom Hook]
        Store[Global Weight Store<br/>Zustand]
        Components[React Components<br/>UI Display]
    end

    Scale -->|"Kabel Serial/USB<br/>Raw Bytes"| SerialPort
    SerialPort -->|"Continuous Stream"| Reader
    Reader -->|"String: 1210 kg"| Parser
    Parser -->|"WeightData{}"| StabilityChecker
    StabilityChecker -->|"+ Stable Flag"| Controller
    Controller -->|"Poll Every 500ms"| Stream
    Stream -->|"EventsEmit(weight_update)"| Wails
    Wails -->|"IPC Bridge"| EventBus
    EventBus -->|"Distribute to Subscribers"| Hook
    Hook -->|"State Management"| Store
    Store -->|"Re-render"| Components
    Components -->|"Display: 1.210 kg"| User[👤 User]
```

## 2. Sequence Diagram (Real-time Process Flow)

```mermaid
sequenceDiagram
    participant HW as ⚖️ Timbangan
    participant Port as COM Port
    participant SR as SerialReader
    participant Parser as Data Parser
    participant SC as Stability Checker
    participant WM as Weight Controller
    participant Stream as Event Stream
    participant Wails as Wails Bridge
    participant EC as Event Coordinator
    participant Hook as useWeightMonitoring
    participant UI as React Component

    Note over SR: Goroutine readLoop() running

    rect rgb(200, 220, 240)
        Note over HW,Parser: Backend: Data Acquisition
        loop Continuous Reading
            HW->>Port: Send Bytes (e.g., "1210 kg\n")
            Port->>SR: Read Buffer
            SR->>SR: bufio.Scanner.Scan()
            SR->>Parser: parseLine("1210 kg")
            Parser->>Parser: Extract: 1210.0
            Parser->>Parser: Convert: 121000 (centesimal)
            Parser->>SC: Check Stability
            SC->>SC: Buffer last 10 readings
            SC->>SC: Calculate range (max-min)
            SC-->>Parser: Return stable: true/false
            Parser-->>SR: WeightData{Weight:121000, Stable:true}
            SR->>SR: Store in buffer
        end
    end

    rect rgb(220, 240, 200)
        Note over Stream,Wails: Backend: Event Broadcasting
        loop Every 500ms
            Stream->>WM: GetCurrentWeight()
            WM->>SR: Read latest from buffer
            SR-->>WM: WeightData
            WM-->>Stream: WeightReading
            Stream->>Stream: Construct Event
            Stream->>Wails: EventsEmit("weight_update", event)
            Stream->>Wails: EventsEmit("connection_status", status)
        end
    end

    rect rgb(240, 220, 200)
        Note over EC,UI: Frontend: Event Handling & Display
        Wails->>EC: Receive weight_update event
        EC->>EC: Parse JSON
        EC->>EC: Distribute to subscribers
        
        par Parallel Distribution
            EC->>Hook: Callback (componentId-1)
            EC->>Hook: Callback (componentId-2)
            EC->>Hook: Callback (componentId-N)
        end
        
        Hook->>Hook: Update State
        Hook->>UI: Trigger re-render
        UI->>UI: Format: 1.210 kg
        UI-->>User: Display on screen
    end
```

## 3. Component Interaction Diagram

```mermaid
graph TB
    subgraph HardwareLayer ["Hardware Layer"]
        Timbangan[Timbangan Digital]
    end

    subgraph GoBackend ["Go Backend - internal/serial/"]
        SerialGo[serial.go<br/>━━━━━━━━━━<br/>• NewSerialReader<br/>• Connect/Disconnect<br/>• Start/Stop]
        ReadLoop[readLoop goroutine<br/>━━━━━━━━━━<br/>• Continuous scanning<br/>• Non-blocking read<br/>• Error recovery]
        ParseFunc[parseLine functions<br/>━━━━━━━━━━<br/>• parseSimpleFormat<br/>• parseCommaFormat<br/>• parseNumericFormat]
        StabilityFunc[checkStability<br/>━━━━━━━━━━<br/>• 10-reading buffer<br/>• Range calculation<br/>• Threshold: ±0.5kg]
        DiagnosticGo[windows_diagnostics.go<br/>━━━━━━━━━━<br/>• Registry queries<br/>• Port existence check<br/>• Virtual port detection]
    end

    subgraph GoController ["Go Backend - app_weight_monitor.go"]
        AppMethods[Exported Methods<br/>━━━━━━━━━━<br/>• StartWeightMonitoring<br/>• StopWeightMonitoring<br/>• TestCOMPortConnection]
        EventStream[startWeightEventStream<br/>━━━━━━━━━━<br/>• time.Ticker 500ms<br/>• Context management<br/>• Event emission]
    end

    subgraph WailsLayer ["Wails Framework"]
        Runtime[Wails Runtime<br/>━━━━━━━━━━<br/>• EventsEmit<br/>• IPC Bridge<br/>• Type conversion]
    end

    subgraph ReactFrontend ["React Frontend"]
        EventCoord[EventCoordinator.js<br/>━━━━━━━━━━<br/>• Singleton pattern<br/>• Global listener<br/>• Event distribution<br/>• Heartbeat monitor]
        WeightHook[useWeightMonitoring.js<br/>━━━━━━━━━━<br/>• State management<br/>• Permission check<br/>• Lifecycle handling<br/>• Callback support]
        GlobalStore[useGlobalWeightStore.js<br/>━━━━━━━━━━<br/>• Zustand store<br/>• Cross-component state<br/>• Analytics tracking]
        UIComponents[React Components<br/>━━━━━━━━━━<br/>• TimbanganPage<br/>• WeightDisplay<br/>• SerialSettings]
    end

    Timbangan -->|Serial/USB Cable| SerialGo
    SerialGo -->|Initialize| ReadLoop
    ReadLoop -->|Raw String| ParseFunc
    ParseFunc -->|WeightData| StabilityFunc
    StabilityFunc -->|+ Stable flag| SerialGo
    SerialGo -.->|Used by| DiagnosticGo
    
    AppMethods -->|Control| SerialGo
    EventStream -->|Poll| SerialGo
    EventStream -->|Emit| Runtime
    
    Runtime ==>|Event: weight_update| EventCoord
    EventCoord ==>|Subscribe| WeightHook
    WeightHook -->|Update| GlobalStore
    GlobalStore -->|State| UIComponents
```

## 4. Data Structure Flow

```mermaid
flowchart LR
    subgraph Input ["Input dari Timbangan"]
        Raw["Raw String<br/>━━━━━━━━━━<br/>ST,GS,+00120.0kg<br/>atau<br/>1210 kg"]
    end
    
    subgraph Parse1 ["Step 1: Parse"]
        Clean["Clean String<br/>━━━━━━━━━━<br/>1210.0"]
    end
    
    subgraph Parse2 ["Step 2: Convert"]
        Centesimal["Centesimal Integer<br/>━━━━━━━━━━<br/>121000<br/>(untuk 2 desimal)"]
    end
    
    subgraph Parse3 ["Step 3: Stability"]
        Buffer["10-Reading Buffer<br/>━━━━━━━━━━<br/>[120900, 121000, 121100...]<br/>Range check"]
    end
    
    subgraph GoStruct ["Go Struct"]
        WeightData["WeightData<br/>━━━━━━━━━━<br/>Weight: 121000<br/>Unit: kg<br/>Stable: true<br/>Timestamp: time.Now()"]
    end
    
    subgraph Event ["Wails Event"]
        JSON["JSON Object<br/>━━━━━━━━━━<br/>{<br/>  weight: 1210.0,<br/>  unit: 'kg',<br/>  stable: true,<br/>  timestamp: Date<br/>}"]
    end
    
    subgraph FrontendState ["Frontend State"]
        ReactState["React State<br/>━━━━━━━━━━<br/>currentWeight: 1210.0<br/>isStable: true<br/>isConnected: true"]
    end
    
    subgraph Display ["UI Display"]
        UserView["User View<br/>━━━━━━━━━━<br/>1.210 kg<br/>✓ Stabil"]
    end

    Raw --> Clean
    Clean --> Centesimal
    Centesimal --> Buffer
    Buffer --> WeightData
    WeightData --> JSON
    JSON --> ReactState
    ReactState --> UserView
```

## 5. Concurrency & Threading Model

```mermaid
graph TB
    subgraph Main ["Main Thread"]
        MainGo[Main Goroutine<br/>App Initialization]
    end
    
    subgraph Goroutines ["Background Goroutines"]
        ReadLoopG[readLoop()<br/>━━━━━━━━━━<br/>• Infinite loop<br/>• Blocking I/O<br/>• Auto-reconnect]
        
        MonitorG[monitorConnection()<br/>━━━━━━━━━━<br/>• Health check ticker<br/>• 3s interval<br/>• Reconnect trigger]
        
        StreamG[startWeightEventStream()<br/>━━━━━━━━━━<br/>• 500ms ticker<br/>• Poll latest weight<br/>• Emit to frontend]
    end
    
    subgraph Channels ["Go Channels"]
        DataCh[dataChan<br/>buffer: 10<br/>WeightData]
        ErrorCh[errorChan<br/>buffer: 10<br/>Error]
        ReconnectCh[reconnectChan<br/>buffer: 10<br/>Signal]
        StopCh[stopChan<br/>unbuffered<br/>Shutdown]
    end
    
    subgraph JSThread ["JavaScript Main Thread"]
        EventLoop[Event Loop<br/>━━━━━━━━━━<br/>• Async callbacks<br/>• State updates<br/>• Re-renders]
    end

    MainGo -->|Spawn| ReadLoopG
    MainGo -->|Spawn| MonitorG
    MainGo -->|Spawn| StreamG
    
    ReadLoopG -->|Send| DataCh
    ReadLoopG -->|Send| ErrorCh
    MonitorG -->|Send| ReconnectCh
    
    StreamG -->|Receive| DataCh
    StreamG -->|Wails IPC| EventLoop
    
    StopCh -->|Signal| ReadLoopG
    StopCh -->|Signal| MonitorG
    StopCh -->|Signal| StreamG
```

## 6. Error Handling & Recovery

```mermaid
stateDiagram-v2
    [*] --> Disconnected: Initial State
    
    Disconnected --> Connecting: Start()
    Connecting --> Connected: Success
    Connecting --> Error: Failed
    
    Connected --> Reading: Port OK
    Reading --> Stable: Data Valid
    Reading --> Unstable: Data Fluctuating
    Reading --> Error: Read Fail
    
    Stable --> Reading: Continue
    Unstable --> Reading: Continue
    
    Error --> Reconnecting: Auto Retry
    Reconnecting --> Connected: Success (1-10 attempts)
    Reconnecting --> Disconnected: Max Attempts Reached
    
    Connected --> Disconnected: Stop() or Fatal Error
    
    note right of Reconnecting
        Exponential Backoff:
        • Start: 1s
        • Max: 30s
        • Max Attempts: 10
    end note
    
    note right of Stable
        Stability Algorithm:
        • Buffer 10 readings
        • Calculate range
        • Threshold: ±50 (0.5kg)
    end note
```

## 7. Configuration & Initialization Flow

```mermaid
sequenceDiagram
    participant User as User
    participant ENV as .env File
    participant Backend as Go Backend
    participant SerialReader as SerialReader
    participant Registry as Windows Registry
    participant Port as COM Port

    Note over ENV: Configuration hardcoded<br/>SERIAL_COM_PORT=COM5<br/>SERIAL_BAUD_RATE=9600
    
    Backend->>ENV: Load environment variables
    ENV-->>Backend: Port config (COM5, 9600, etc)
    
    Backend->>SerialReader: Initialize with config
    
    Note over SerialReader,Registry: Lightweight port validation
    SerialReader->>Registry: Check if COM5 exists
    Registry-->>SerialReader: Port found (no WMI query)
    
    SerialReader->>Port: Connect to COM5
    Port-->>SerialReader: Connection established
    
    Note over User,Port: No UI configuration needed<br/>Port settings are read-only in UI<br/>No WMI overhead during runtime
```

## 8. Key Files & Responsibilities

| Layer | File Path | Responsibility |
|-------|-----------|----------------|
| **Hardware** | - | Physical scale device |
| **Configuration** | [`.env`](file:///e:/gosmartmillscale/desktop-app/.env) | Serial port configuration (COM port, baud rate, etc) |
| **Backend - Serial** | [`internal/serial/serial.go`](file:///e:/gosmartmillscale/desktop-app/internal/serial/serial.go) | Low-level port communication, data parsing |
| **Backend - Serial** | [`internal/serial/windows_diagnostics.go`](file:///e:/gosmartmillscale/desktop-app/internal/serial/windows_diagnostics.go) | Registry-based port validation (WMI removed) |
| **Backend - Serial** | `internal/serial/windows_elevation.go` | Permission checking, admin elevation |
| **Backend - Controller** | [`app_weight_monitor.go`](file:///e:/gosmartmillscale/desktop-app/app_weight_monitor.go) | Weight monitoring control, event streaming |
| **Backend - Controller** | `app_weighing.go` | Weighing transaction operations |
| **Wails Bridge** | [`app.go`](file:///e:/gosmartmillscale/desktop-app/app.go) | Application lifecycle, service initialization |
| **Frontend - Service** | [`shared/services/EventCoordinator.js`](file:///e:/gosmartmillscale/desktop-app/frontend/src/shared/services/EventCoordinator.js) | Global event distribution, subscriber management |
| **Frontend - Hook** | [`shared/hooks/useWeightMonitoring.js`](file:///e:/gosmartmillscale/desktop-app/frontend/src/shared/hooks/useWeightMonitoring.js) | React state management, lifecycle handling |
| **Frontend - Store** | `shared/store/useGlobalWeightStore.js` | Global weight state, analytics |
| **Frontend - Settings** | [`features/settings/store/useSettingsStore.js`](file:///e:/gosmartmillscale/desktop-app/frontend/src/features/settings/store/useSettingsStore.js) | Settings state management (read-only port display) |
| **Frontend - UI** | [`features/settings/components/SerialSettings.jsx`](file:///e:/gosmartmillscale/desktop-app/frontend/src/features/settings/components/SerialSettings.jsx) | Serial port settings display (read-only) |

## 9. Performance Characteristics

- **Reading Frequency**: Continuous (as fast as hardware sends)
- **Event Emission**: 500ms (2 updates/second)
- **Stability Check**: Rolling window of 10 readings
- **Reconnect Backoff**: 1s → 2s → 4s → ... → max 30s
- **Max Reconnect Attempts**: 10
- **Channel Buffer Size**: 10 (data), 10 (error), 10 (reconnect)
- **Port Validation**: Registry-only (no WMI overhead)
- **Connection Time**: < 100ms (without WMI queries)

## 10. Example Data Flow

```
INPUT (Timbangan):     "1210 kg\n"
                       ↓
PARSE:                 1210.0 (float)
                       ↓
CONVERT:               121000 (int centesimal)
                       ↓
STABILITY CHECK:       [121000, 121050, 120980, ...] → Range: 70 → Stable ✓
                       ↓
GO STRUCT:             WeightData{Weight: 121000, Stable: true, Unit: "kg"}
                       ↓
WAILS EVENT:           {"name": "weight_update", "data": {...}}
                       ↓
EVENT COORDINATOR:     Distribute to 3 subscribers
                       ↓
REACT STATE:           currentWeight: 1210.0, isStable: true
                       ↓
UI DISPLAY:            "1.210 kg ✓ Stabil"
```
