# Dashboard Weight Widget Integration Guide

## 📋 Overview

Panduan lengkap untuk mengintegrasikan weight monitoring widgets ke dashboard role-based yang sudah ada. Setiap role memiliki widget khusus yang disesuaikan dengan kebutuhan mereka.

## 🎯 Available Widgets

| Widget | Role | Features |
|--------|------|----------|
| **AdminWeightWidget** | ADMIN | Full monitoring + analytics + trend + system status |
| **SupervisorWeightWidget** | SUPERVISOR | Monitoring + analytics + recent weighings |
| **OperatorWeightWidget** | TIMBANGAN | Large display + operational focus + capture ready |
| **GradingWeightWidget** | GRADING | Read-only + current weight + stable history |

## 🚀 Quick Start

### Step 1: Import Widget

```javascript
import { AdminWeightWidget } from '../../shared/components/dashboard'
// atau
import {
  AdminWeightWidget,
  SupervisorWeightWidget,
  OperatorWeightWidget,
  GradingWeightWidget
} from '../../shared/components/dashboard'
```

### Step 2: Add to Dashboard

```javascript
<AdminWeightWidget wails={wails} className="mb-6" />
```

### Step 3: Done! 🎉

Widget akan otomatis:
- ✅ Check user permissions
- ✅ Start real-time monitoring
- ✅ Handle events
- ✅ Cleanup on unmount

## 📖 Integration Examples

### 1. Admin Dashboard Integration

**File:** `src/features/dashboard/components/role-dashboards/AdminDashboard.jsx`

```javascript
import React from 'react'
import { AdminWeightWidget } from '../../../../shared/components/dashboard'

const AdminDashboard = ({ wails, currentUser }) => {
  return (
    <div className="space-y-6">
      {/* Weight Monitoring Widget - Full Analytics */}
      <AdminWeightWidget wails={wails} />

      {/* Other admin widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your existing dashboard components */}
      </div>
    </div>
  )
}

export default AdminDashboard
```

**Features yang tersedia untuk ADMIN:**
- ✅ Real-time weight display (large)
- ✅ Connection status monitoring
- ✅ Complete statistics (total, avg, max, min)
- ✅ Trend analysis (1 hour)
- ✅ System uptime & connection stability
- ✅ Live monitoring badge

---

### 2. Supervisor Dashboard Integration

**File:** `src/features/dashboard/components/role-dashboards/SupervisorDashboard.jsx`

```javascript
import React from 'react'
import { SupervisorWeightWidget } from '../../../../shared/components/dashboard'

const SupervisorDashboard = ({ wails, currentUser }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Weight Monitoring Widget - Compact with Analytics */}
      <div className="lg:col-span-1">
        <SupervisorWeightWidget wails={wails} />
      </div>

      {/* Other supervisor widgets */}
      <div className="lg:col-span-2">
        {/* Your existing dashboard components */}
      </div>
    </div>
  )
}

export default SupervisorDashboard
```

**Features yang tersedia untuk SUPERVISOR:**
- ✅ Current weight display (compact)
- ✅ Quick stats (total, avg, max)
- ✅ Period statistics (last hour)
- ✅ Recent 5 weighings
- ✅ Connection status badge

---

### 3. Timbangan (Operator) Dashboard Integration

**File:** `src/features/dashboard/components/role-dashboards/TimbanganDashboard.jsx`

```javascript
import React from 'react'
import { OperatorWeightWidget } from '../../../../shared/components/dashboard'

const TimbanganDashboard = ({ wails, currentUser }) => {
  return (
    <div className="space-y-6">
      {/* Weight Monitoring Widget - Large Operational Display */}
      <OperatorWeightWidget wails={wails} className="max-w-2xl mx-auto" />

      {/* Quick action buttons */}
      <div className="max-w-2xl mx-auto">
        {/* Your existing operational components */}
      </div>
    </div>
  )
}

export default TimbanganDashboard
```

**Features yang tersedia untuk TIMBANGAN:**
- ✅ Extra large weight display (8xl font)
- ✅ Stability indicator (prominent)
- ✅ Ready for capture status
- ✅ Connection status
- ✅ Mode indicator (Real-time/Standby)
- ✅ Visual alerts for unstable weights
- ✅ Optimized for operator visibility

---

### 4. Grading Dashboard Integration

**File:** `src/features/dashboard/components/role-dashboards/GradingDashboard.jsx`

```javascript
import React from 'react'
import { GradingWeightWidget } from '../../../../shared/components/dashboard'

const GradingDashboard = ({ wails, currentUser }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Weight Information Widget - Read-only */}
      <div className="lg:col-span-1">
        <GradingWeightWidget wails={wails} />
      </div>

      {/* Grading tools */}
      <div className="lg:col-span-2">
        {/* Your existing grading components */}
      </div>
    </div>
  )
}

export default GradingDashboard
```

**Features yang tersedia untuk GRADING:**
- ✅ Current weight display (read-only)
- ✅ Daily statistics summary
- ✅ Recent 5 stable weights
- ✅ Connection status
- ✅ Read-only notice
- ✅ No control buttons (view only)

---

## 🎨 Layout Examples

### Full Width Layout

```javascript
<div className="space-y-6">
  <AdminWeightWidget wails={wails} />
</div>
```

### Grid Layout

```javascript
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-1">
    <SupervisorWeightWidget wails={wails} />
  </div>
  <div className="lg:col-span-2">
    {/* Other components */}
  </div>
</div>
```

### Centered Layout (Operator)

```javascript
<div className="max-w-3xl mx-auto">
  <OperatorWeightWidget wails={wails} />
</div>
```

---

## ⚙️ Advanced Usage

### Conditional Rendering

```javascript
const Dashboard = ({ wails, currentUser }) => {
  // Show weight widget only if monitoring is enabled
  const [showWeightWidget, setShowWeightWidget] = useState(true)

  return (
    <div>
      {showWeightWidget && (
        <AdminWeightWidget wails={wails} />
      )}
    </div>
  )
}
```

### Custom Styling

```javascript
<SupervisorWeightWidget
  wails={wails}
  className="shadow-2xl border-blue-500/30"
/>
```

### Responsive Design

```javascript
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  <div className="md:col-span-2 xl:col-span-1">
    <OperatorWeightWidget wails={wails} />
  </div>
</div>
```

---

## 🔌 Props Reference

### Common Props (All Widgets)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `wails` | Object | Yes | Wails instance for backend connection |
| `className` | String | No | Additional CSS classes |

### Example with Props

```javascript
<AdminWeightWidget
  wails={wails}
  className="shadow-lg border-2 border-blue-500"
/>
```

---

## 🎯 Feature Comparison

| Feature | Admin | Supervisor | Operator | Grading |
|---------|-------|------------|----------|---------|
| Current Weight | ✅ Large | ✅ Compact | ✅ XL | ✅ Medium |
| Connection Status | ✅ Detailed | ✅ Badge | ✅ Visual | ✅ Simple |
| Total Stats | ✅ | ✅ | ❌ | ✅ Limited |
| Analytics | ✅ Full | ✅ Partial | ❌ | ❌ |
| Trend Analysis | ✅ | ❌ | ❌ | ❌ |
| Recent Weighings | ❌ | ✅ Top 5 | ❌ | ✅ Top 5 |
| System Uptime | ✅ | ❌ | ❌ | ❌ |
| Ready for Capture | ❌ | ❌ | ✅ | ❌ |
| Read-only Notice | ❌ | ❌ | ❌ | ✅ |

---

## 🐛 Troubleshooting

### Widget Not Showing

**Possible causes:**
1. User role tidak memiliki akses
2. Wails instance tidak di-pass
3. Import path salah

**Solution:**
```javascript
// ✅ Correct import
import { AdminWeightWidget } from '../../../../shared/components/dashboard'

// ✅ Correct usage
<AdminWeightWidget wails={wails} />
```

### No Real-time Updates

**Possible causes:**
1. Weight monitoring belum started
2. Serial port tidak terhubung
3. Wails events tidak ter-register

**Solution:**
- Check browser console untuk error
- Verify serial port connection
- Check backend monitoring status

### Permission Denied

**Possible causes:**
1. User role tidak valid
2. currentUser object kosong

**Solution:**
```javascript
// Verify user object
console.log('Current user:', currentUser)
console.log('User role:', currentUser?.role)
```

---

## 📝 Complete Integration Example

**File:** `src/features/dashboard/components/role-dashboards/AdminDashboard.jsx`

```javascript
import React from 'react'
import { AdminWeightWidget } from '../../../../shared/components/dashboard'
// Import other dashboard components...

const AdminDashboard = ({ wails, currentUser }) => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome, {currentUser?.fullName || currentUser?.username}
          </p>
        </div>

        {/* Weight Monitoring Widget */}
        <AdminWeightWidget wails={wails} />

        {/* Other Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              System Health
            </h2>
            {/* Your system health content */}
          </div>

          {/* User Activity */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              User Activity
            </h2>
            {/* Your user activity content */}
          </div>
        </div>

        {/* Recent Operations */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Operations
          </h2>
          {/* Your recent operations content */}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
```

---

## 🎓 Best Practices

### 1. Always Pass Wails Instance

```javascript
// ✅ Good
<AdminWeightWidget wails={wails} />

// ❌ Bad
<AdminWeightWidget />
```

### 2. Use Appropriate Widget for Role

```javascript
// ✅ Good - Match widget to user role
{currentUser.role === 'ADMIN' && <AdminWeightWidget wails={wails} />}
{currentUser.role === 'SUPERVISOR' && <SupervisorWeightWidget wails={wails} />}

// ❌ Bad - Wrong widget for role
{currentUser.role === 'GRADING' && <AdminWeightWidget wails={wails} />}
```

### 3. Handle Loading States

```javascript
{isLoadingDashboard ? (
  <LoadingSpinner />
) : (
  <AdminWeightWidget wails={wails} />
)}
```

### 4. Responsive Layouts

```javascript
// ✅ Good - Responsive
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <OperatorWeightWidget wails={wails} />
</div>

// ❌ Bad - Fixed width
<div style={{ width: '800px' }}>
  <OperatorWeightWidget wails={wails} />
</div>
```

---

## 📚 Additional Resources

- [Weight Monitoring Guide](./WEIGHT_MONITORING_GUIDE.md)
- [Custom Hooks Documentation](./WEIGHT_MONITORING_GUIDE.md#available-hooks)
- [Role Permissions Matrix](./WEIGHT_MONITORING_GUIDE.md#role-based-permissions)

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
**Maintainer:** Smart Mill Scale Team
