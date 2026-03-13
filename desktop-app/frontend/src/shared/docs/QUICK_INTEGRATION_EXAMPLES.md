# Quick Integration Examples - Copy & Paste Ready

## 🚀 Copy-Paste Examples untuk Setiap Dashboard

### 1. Admin Dashboard - Complete Integration

```javascript
// File: src/features/dashboard/components/role-dashboards/AdminDashboard.jsx

import React from 'react'
import { AdminWeightWidget } from '../../../../shared/components/dashboard'

const AdminDashboard = ({ wails, currentUser }) => {
  return (
    <div className="space-y-6">
      {/* Weight Monitoring - Full Analytics */}
      <AdminWeightWidget wails={wails} />

      {/* Rest of your dashboard */}
    </div>
  )
}

export default AdminDashboard
```

---

### 2. Supervisor Dashboard - Compact Integration

```javascript
// File: src/features/dashboard/components/role-dashboards/SupervisorDashboard.jsx

import React from 'react'
import { SupervisorWeightWidget } from '../../../../shared/components/dashboard'

const SupervisorDashboard = ({ wails, currentUser }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Weight Widget - Sidebar */}
      <div className="lg:col-span-1">
        <SupervisorWeightWidget wails={wails} />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Your existing components */}
      </div>
    </div>
  )
}

export default SupervisorDashboard
```

---

### 3. Timbangan Dashboard - Large Display

```javascript
// File: src/features/dashboard/components/role-dashboards/TimbanganDashboard.jsx

import React from 'react'
import { OperatorWeightWidget } from '../../../../shared/components/dashboard'

const TimbanganDashboard = ({ wails, currentUser }) => {
  return (
    <div className="space-y-6">
      {/* Large Weight Display - Centered */}
      <div className="max-w-3xl mx-auto">
        <OperatorWeightWidget wails={wails} />
      </div>

      {/* Quick Actions */}
      <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4">
        {/* Your action buttons */}
      </div>
    </div>
  )
}

export default TimbanganDashboard
```

---

### 4. Grading Dashboard - Read-Only View

```javascript
// File: src/features/dashboard/components/role-dashboards/GradingDashboard.jsx

import React from 'react'
import { GradingWeightWidget } from '../../../../shared/components/dashboard'

const GradingDashboard = ({ wails, currentUser }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Weight Info - Sidebar */}
      <div className="lg:col-span-1">
        <GradingWeightWidget wails={wails} />
      </div>

      {/* Grading Tools */}
      <div className="lg:col-span-2 space-y-6">
        {/* Your grading components */}
      </div>
    </div>
  )
}

export default GradingDashboard
```

---

## 🎨 Alternative Layout Examples

### Side-by-Side Layout

```javascript
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  <AdminWeightWidget wails={wails} />
  <YourOtherWidget />
</div>
```

### Three Column Layout

```javascript
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  <SupervisorWeightWidget wails={wails} />
  <Widget2 />
  <Widget3 />
</div>
```

### Full Width with Sidebar

```javascript
<div className="flex gap-6">
  {/* Sidebar */}
  <div className="w-80 flex-shrink-0">
    <SupervisorWeightWidget wails={wails} />
  </div>

  {/* Main Content */}
  <div className="flex-1">
    {/* Your main content */}
  </div>
</div>
```

---

## 🔧 Custom Hook Usage Examples

### Example 1: Custom Weight Display Component

```javascript
import React from 'react'
import { useWeightData } from '../../shared/hooks'

const CustomWeightDisplay = ({ currentUser }) => {
  const {
    formattedWeight,
    isStable,
    isConnected,
    statusColor
  } = useWeightData({
    role: currentUser.role,
    autoRefresh: true
  })

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <p className={`text-2xl font-bold ${statusColor}`}>
        {formattedWeight}
      </p>
      <p className="text-sm text-gray-400">
        {isConnected ? (isStable ? 'Stabil' : 'Fluktuasi') : 'Offline'}
      </p>
    </div>
  )
}

export default CustomWeightDisplay
```

### Example 2: Weight Monitoring Control Panel

```javascript
import React from 'react'
import { useWeightMonitoring } from '../../shared/hooks'

const WeightControlPanel = ({ wails, currentUser }) => {
  const {
    isMonitoring,
    start,
    stop,
    canControl,
    currentWeight
  } = useWeightMonitoring({
    wails,
    role: currentUser.role,
    autoStart: false,
    autoCleanup: true
  })

  if (!canControl) {
    return <div>No permission to control</div>
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-white mb-4">Weight Control</h3>

      <div className="mb-4">
        <p className="text-3xl font-bold text-green-400">
          {(currentWeight / 100).toFixed(2)} kg
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={start}
          disabled={isMonitoring}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={stop}
          disabled={!isMonitoring}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Stop
        </button>
      </div>

      <p className="text-sm text-gray-400 mt-2">
        Status: {isMonitoring ? 'Running' : 'Stopped'}
      </p>
    </div>
  )
}

export default WeightControlPanel
```

### Example 3: Analytics Widget

```javascript
import React from 'react'
import { useWeightAnalytics } from '../../shared/hooks'

const WeightAnalyticsWidget = ({ currentUser }) => {
  const {
    statistics,
    trend,
    periodStatistics
  } = useWeightAnalytics({
    role: currentUser.role,
    timeRange: 3600000 // 1 hour
  })

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-white font-semibold mb-4">Analytics</h3>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-xl font-bold text-white">
            {statistics.totalWeighings}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Average</p>
          <p className="text-xl font-bold text-blue-400">
            {(statistics.averageWeight / 100).toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Max</p>
          <p className="text-xl font-bold text-green-400">
            {(statistics.maxWeight / 100).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Trend */}
      {trend && (
        <div className="bg-gray-750 p-3 rounded">
          <p className="text-sm text-gray-400">Trend (1h)</p>
          <p className="text-lg font-bold text-white capitalize">
            {trend.direction} ({trend.percentage}%)
          </p>
        </div>
      )}
    </div>
  )
}

export default WeightAnalyticsWidget
```

### Example 4: History Table Component

```javascript
import React from 'react'
import { useWeightHistory } from '../../shared/hooks'

const WeightHistoryTable = ({ currentUser }) => {
  const {
    formattedHistory,
    filteredCount
  } = useWeightHistory({
    role: currentUser.role,
    limit: 10,
    stableOnly: true,
    sortOrder: 'desc'
  })

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-semibold">
          Weight History ({filteredCount} records)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-400">Weight</th>
              <th className="px-4 py-2 text-left text-xs text-gray-400">Status</th>
              <th className="px-4 py-2 text-left text-xs text-gray-400">Time</th>
            </tr>
          </thead>
          <tbody>
            {formattedHistory.map((item) => (
              <tr key={item.id} className="border-t border-gray-700">
                <td className="px-4 py-2 text-white font-medium">
                  {item.formattedWeight}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.isStable ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {item.isStable ? 'Stabil' : 'Fluktuasi'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-400">
                  {item.relativeTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WeightHistoryTable
```

---

## 📱 Responsive Examples

### Mobile-First Design

```javascript
<div className="space-y-4">
  {/* Mobile: Stack vertically */}
  <div className="md:hidden">
    <OperatorWeightWidget wails={wails} />
  </div>

  {/* Desktop: Side by side */}
  <div className="hidden md:grid md:grid-cols-2 gap-4">
    <OperatorWeightWidget wails={wails} />
    <OtherWidget />
  </div>
</div>
```

### Adaptive Layout

```javascript
<div className="container mx-auto px-4">
  {/* Small screens: 1 column */}
  {/* Medium screens: 2 columns */}
  {/* Large screens: 3 columns */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <SupervisorWeightWidget wails={wails} />
    <Widget2 />
    <Widget3 />
  </div>
</div>
```

---

## 🎯 Conditional Rendering Examples

### Show Based on Role

```javascript
const Dashboard = ({ wails, currentUser }) => {
  const renderWeightWidget = () => {
    switch (currentUser.role) {
      case 'ADMIN':
        return <AdminWeightWidget wails={wails} />
      case 'SUPERVISOR':
        return <SupervisorWeightWidget wails={wails} />
      case 'TIMBANGAN':
        return <OperatorWeightWidget wails={wails} />
      case 'GRADING':
        return <GradingWeightWidget wails={wails} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {renderWeightWidget()}
    </div>
  )
}
```

### Show Based on Feature Flag

```javascript
const Dashboard = ({ wails, currentUser, features }) => {
  return (
    <div className="space-y-6">
      {features.enableWeightMonitoring && (
        <AdminWeightWidget wails={wails} />
      )}
    </div>
  )
}
```

---

## 💡 Pro Tips

### Tip 1: Combine Multiple Widgets

```javascript
// Admin dashboard dengan multiple views
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  <AdminWeightWidget wails={wails} />
  <WeightHistoryTable currentUser={currentUser} />
</div>
```

### Tip 2: Add Custom Header

```javascript
<div className="bg-gray-800 rounded-lg overflow-hidden">
  {/* Custom Header */}
  <div className="bg-blue-500/10 border-b border-blue-500/30 p-4">
    <h2 className="text-xl font-bold text-white">
      Real-time Weight Monitoring
    </h2>
  </div>

  {/* Widget */}
  <div className="p-6">
    <AdminWeightWidget wails={wails} />
  </div>
</div>
```

### Tip 3: Add Action Buttons

```javascript
<div className="space-y-4">
  <OperatorWeightWidget wails={wails} />

  {/* Action Buttons */}
  <div className="flex justify-center gap-4">
    <button className="px-6 py-3 bg-green-500 text-white rounded-lg">
      Capture Weight
    </button>
    <button className="px-6 py-3 bg-gray-700 text-white rounded-lg">
      Reset
    </button>
  </div>
</div>
```

---

## 🔗 Import Cheat Sheet

```javascript
// Dashboard Widgets (Role-specific)
import {
  AdminWeightWidget,
  SupervisorWeightWidget,
  OperatorWeightWidget,
  GradingWeightWidget
} from '../../shared/components/dashboard'

// Basic Components (Customizable)
import {
  WeightDisplay,
  ConnectionStatus,
  WeightStatusPanel
} from '../../shared/components/weight'

// Custom Hooks
import {
  useWeightData,
  useWeightMonitoring,
  useWeightAnalytics,
  useWeightHistory,
  useGlobalWeightStore
} from '../../shared/hooks'
```

---

## ✅ Integration Checklist

- [ ] Import appropriate widget for user role
- [ ] Pass `wails` instance to widget
- [ ] Add widget to dashboard JSX
- [ ] Test real-time updates
- [ ] Verify permission checks
- [ ] Check responsive design
- [ ] Test error handling
- [ ] Verify cleanup on unmount

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
