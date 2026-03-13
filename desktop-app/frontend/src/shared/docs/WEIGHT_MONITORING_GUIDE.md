# Weight Monitoring System - Developer Guide

## 📋 Overview

Sistem weight monitoring yang reusable dan dapat digunakan di seluruh aplikasi dengan role-based access control. Sistem ini menyediakan:

- ✅ Real-time weight monitoring dari device fisik
- ✅ Role-based permission system
- ✅ Subscription management untuk multiple components
- ✅ Analytics dan statistics
- ✅ Reusable hooks dan components
- ✅ Auto cleanup dan memory leak prevention

## 🏗️ Architecture

```
Global Weight Store (useGlobalWeightStore)
    ↓
Custom Hooks Layer
    ├── useWeightData (basic data access)
    ├── useWeightMonitoring (real-time monitoring)
    ├── useWeightAnalytics (analytics & trends)
    └── useWeightHistory (historical data)
    ↓
Reusable Components
    ├── WeightDisplay
    ├── ConnectionStatus
    └── WeightStatusPanel
    ↓
Feature Components (Timbang1Page, Dashboards, etc.)
```

## 📦 Installation & Import

### Import Hooks

```javascript
import {
  useWeightData,
  useWeightMonitoring,
  useWeightAnalytics,
  useWeightHistory,
  useGlobalWeightStore
} from '../shared/hooks'
```

### Import Components

```javascript
import {
  WeightDisplay,
  ConnectionStatus,
  WeightStatusPanel
} from '../shared/components/weight'
```

## 🎯 Usage Examples

### 1. Basic Weight Display (Dashboard Widget)

Untuk menampilkan weight di dashboard dengan permission check:

```javascript
import React from 'react'
import { useWeightData } from '../../shared/hooks'

const DashboardWeightWidget = ({ currentUser }) => {
  const {
    hasAccess,
    formattedWeight,
    isStable,
    isConnected,
    connectionStatus,
    statusColor
  } = useWeightData({ role: currentUser.role })

  if (!hasAccess) {
    return <div>No access to weight data</div>
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white mb-2">Berat Timbangan</h3>
      <p className="text-3xl font-bold text-green-400">{formattedWeight}</p>
      <p className={`text-sm ${statusColor}`}>
        {connectionStatus} - {isStable ? 'Stabil' : 'Tidak Stabil'}
      </p>
    </div>
  )
}
```

### 2. Real-Time Monitoring (Form Component)

Untuk form yang membutuhkan real-time monitoring:

```javascript
import React from 'react'
import { useWeightMonitoring } from '../../shared/hooks'

const WeighingForm = ({ wails, currentUser }) => {
  const {
    isMonitoring,
    currentWeight,
    isStable,
    isConnected,
    start,
    stop,
    canControl
  } = useWeightMonitoring({
    wails,
    role: currentUser.role,
    autoStart: true,  // Start monitoring otomatis
    autoCleanup: true, // Cleanup otomatis saat unmount
    onWeightChange: (weight) => {
      console.log('Weight changed:', weight)
    }
  })

  return (
    <div>
      <h2>Real-time Weight: {currentWeight / 100} kg</h2>
      <p>Status: {isStable ? 'Stabil' : 'Tidak Stabil'}</p>

      {canControl && (
        <div>
          <button onClick={start} disabled={isMonitoring}>
            Start Monitoring
          </button>
          <button onClick={stop} disabled={!isMonitoring}>
            Stop Monitoring
          </button>
        </div>
      )}
    </div>
  )
}
```

### 3. Analytics Dashboard (Supervisor/Admin)

Untuk dashboard dengan analytics:

```javascript
import React from 'react'
import { useWeightAnalytics } from '../../shared/hooks'

const AnalyticsDashboard = ({ currentUser }) => {
  const {
    hasAccess,
    statistics,
    trend,
    periodStatistics,
    recentWeighings,
    monitoringDuration
  } = useWeightAnalytics({
    role: currentUser.role,
    timeRange: 3600000, // 1 hour
    includeHistory: true
  })

  if (!hasAccess) {
    return <div>Anda tidak memiliki akses ke analytics</div>
  }

  return (
    <div>
      <h2>Weight Analytics</h2>

      {/* Overall Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div>Total: {statistics.totalWeighings}</div>
        <div>Average: {(statistics.averageWeight / 100).toFixed(2)} kg</div>
        <div>Max: {(statistics.maxWeight / 100).toFixed(2)} kg</div>
        <div>Min: {(statistics.minWeight / 100).toFixed(2)} kg</div>
      </div>

      {/* Trend */}
      <div>
        <h3>Trend</h3>
        <p>Direction: {trend.direction}</p>
        <p>Change: {trend.percentage}%</p>
      </div>

      {/* Recent Weighings */}
      <div>
        <h3>Recent Weighings</h3>
        <ul>
          {recentWeighings.map((w, i) => (
            <li key={i}>{w.weight} kg - {w.timestamp}</li>
          ))}
        </ul>
      </div>

      {/* Monitoring Duration */}
      <div>
        <p>Monitoring Duration: {monitoringDuration.formatted}</p>
      </div>
    </div>
  )
}
```

### 4. History View (Grading/Read-Only)

Untuk menampilkan history dengan filtering:

```javascript
import React from 'react'
import { useWeightHistory } from '../../shared/hooks'

const WeightHistoryView = ({ currentUser }) => {
  const {
    hasAccess,
    formattedHistory,
    groupedByDate,
    statistics,
    filteredCount,
    hasMore
  } = useWeightHistory({
    role: currentUser.role,
    limit: 20,
    stableOnly: true,
    sortOrder: 'desc'
  })

  if (!hasAccess) {
    return <div>No access to history</div>
  }

  return (
    <div>
      <h2>Weight History</h2>

      {/* Statistics */}
      <div>
        <p>Total: {statistics.total}</p>
        <p>Stable: {statistics.stable}</p>
        <p>Average: {statistics.averageWeight} kg</p>
      </div>

      {/* Grouped by Date */}
      {groupedByDate.map((group) => (
        <div key={group.date}>
          <h3>{group.date} ({group.count} weighings)</h3>
          <ul>
            {group.events.map((event) => (
              <li key={event.id}>
                {event.formattedWeight} - {event.formattedTime}
                ({event.relativeTime})
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Pagination */}
      <p>Showing {formattedHistory.length} of {filteredCount} records</p>
      {hasMore && <button>Load More</button>}
    </div>
  )
}
```

### 5. Using Reusable Components

Menggunakan pre-built components:

```javascript
import React from 'react'
import { WeightDisplay, ConnectionStatus, WeightStatusPanel } from '../../shared/components/weight'

const DashboardPage = ({ currentUser }) => {
  return (
    <div>
      {/* Simple Weight Display */}
      <WeightDisplay
        role={currentUser.role}
        size="large"
        showStatus={true}
      />

      {/* Connection Status Badge */}
      <ConnectionStatus
        role={currentUser.role}
        variant="badge"
      />

      {/* Complete Status Panel with Analytics */}
      <WeightStatusPanel
        role={currentUser.role}
        showAnalytics={true}
        showConnection={true}
        size="medium"
      />
    </div>
  )
}
```

## 🔐 Role-Based Permissions

### Permission Matrix

| Role       | canView | canControl | canAnalyze | canExport |
|------------|---------|------------|------------|-----------|
| ADMIN      | ✅      | ✅         | ✅         | ✅        |
| SUPERVISOR | ✅      | ✅         | ✅         | ✅        |
| TIMBANGAN  | ✅      | ✅         | ❌         | ❌        |
| GRADING    | ✅      | ❌         | ❌         | ❌        |

### Using Permissions

```javascript
const { canControl, canAnalyze } = useWeightData({ role: 'TIMBANGAN' })

if (canControl) {
  // Show start/stop buttons
}

if (canAnalyze) {
  // Show analytics dashboard
}
```

## 📊 Available Hooks

### 1. useWeightData

Basic weight data access dengan auto-refresh dan permission check.

**Parameters:**
- `role`: User role string
- `autoRefresh`: Enable auto-refresh (default: false)
- `refreshInterval`: Refresh interval in ms (default: 5000)

**Returns:**
- `hasAccess`, `canAnalyze`, `canControl`
- `currentWeight`, `isStable`, `isConnected`, `unit`
- `formattedWeight`, `weightInKg`, `connectionStatus`
- `statusColor`, `badgeColor`, `isReadyForCapture`
- `statistics`, `refresh()`

### 2. useWeightMonitoring

Real-time monitoring dengan lifecycle management.

**Parameters:**
- `wails`: Wails instance
- `role`: User role
- `autoStart`: Auto start monitoring (default: false)
- `autoCleanup`: Auto cleanup (default: true)
- `onWeightChange`: Weight change callback
- `onConnectionChange`: Connection change callback

**Returns:**
- `isMonitoring`, `isStarting`, `isStopping`
- `currentWeight`, `isStable`, `isConnected`
- `start()`, `stop()`
- `canControl`, `isReady`, `isActive`

### 3. useWeightAnalytics

Analytics dan statistics untuk dashboard.

**Parameters:**
- `role`: User role
- `timeRange`: Time range in ms (default: 3600000)
- `includeHistory`: Include history (default: true)

**Returns:**
- `statistics`, `periodStatistics`
- `trend`, `recentWeighings`
- `monitoringDuration`, `weightDistribution`
- `connectionStability`

### 4. useWeightHistory

Historical data dengan filtering dan sorting.

**Parameters:**
- `role`: User role
- `limit`: Max records (default: 50)
- `filterType`: Filter by type
- `stableOnly`: Only stable weights
- `minWeight`, `maxWeight`: Weight range
- `sortOrder`: 'asc' or 'desc'

**Returns:**
- `history`, `formattedHistory`, `groupedByDate`
- `statistics`, `filteredCount`, `totalCount`
- `hasMore`, `paginationInfo`

## 🎨 Available Components

### 1. WeightDisplay

Basic weight display dengan berbagai sizes.

**Props:**
- `role`: User role
- `size`: 'small' | 'medium' | 'large' | 'xl'
- `showUnit`: Show kg unit
- `showStatus`: Show stability status
- `onClick`: Click handler

### 2. ConnectionStatus

Connection status indicator.

**Props:**
- `role`: User role
- `variant`: 'compact' | 'detailed' | 'badge'
- `showMonitoringState`: Show monitoring state

### 3. WeightStatusPanel

Comprehensive panel dengan analytics.

**Props:**
- `role`: User role
- `showAnalytics`: Show analytics section
- `showConnection`: Show connection status
- `size`: 'small' | 'medium' | 'large'
- `onWeightClick`: Click handler

## 🚀 Best Practices

### 1. Memory Management

Hooks akan otomatis cleanup subscriptions saat unmount. Pastikan menggunakan `autoCleanup: true` di useWeightMonitoring.

### 2. Permission Checks

Selalu check `hasAccess` sebelum rendering data:

```javascript
if (!hasAccess) {
  return <NoAccessMessage />
}
```

### 3. Loading States

Handle loading states untuk UX yang lebih baik:

```javascript
const { isReady, isInitialized } = useWeightMonitoring({ ... })

if (!isReady) {
  return <LoadingSpinner />
}
```

### 4. Error Handling

Selalu handle error states:

```javascript
const { error } = useWeightData({ ... })

if (error) {
  return <ErrorMessage message={error} />
}
```

## 📝 Migration Guide

### Migrating from Local useWeightStore

**Before:**
```javascript
import useWeightStore from './useWeightStore'

const { currentWeight, initialize, cleanup } = useWeightStore()

useEffect(() => {
  initialize(wails)
  return () => cleanup()
}, [])
```

**After:**
```javascript
import { useWeightMonitoring } from '../../shared/hooks'

const {
  currentWeight
} = useWeightMonitoring({
  wails,
  role: currentUser.role,
  autoStart: true,
  autoCleanup: true
})
```

## 🐛 Troubleshooting

### Issue: "No Access" Error

**Solution:** Pastikan user role valid dan ada di `allowedRoles`. Check permission matrix.

### Issue: Weight Not Updating

**Solution:**
1. Check Wails connection
2. Verify weight monitoring is started
3. Check console logs untuk error

### Issue: Memory Leaks

**Solution:**
1. Pastikan menggunakan `autoCleanup: true`
2. Jangan lupa cleanup manual subscriptions
3. Check browser DevTools Memory tab

## 📚 Additional Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Wails Events Documentation](https://wails.io/docs/howdoesitwork/)
- [React Hooks Best Practices](https://react.dev/reference/react)

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
**Maintainer:** Smart Mill Scale Team
