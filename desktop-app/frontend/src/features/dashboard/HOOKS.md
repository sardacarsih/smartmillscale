# Dashboard Hooks Documentation

This document describes all custom hooks available for the dashboard feature.

## Overview

The dashboard module provides a comprehensive set of React hooks that integrate with the backend API using React Query for efficient data fetching, caching, and state management.

## Hooks

### 1. `useDashboard(userId)`

Main hook for dashboard data and operations.

**Parameters:**
- `userId` (string): User ID to fetch dashboard for

**Returns:**
```javascript
{
  // Data
  dashboard,           // Dashboard data object
  isLoading,          // Loading state
  isError,            // Error state
  error,              // Error object

  // Operations
  updateDashboard,    // (dashboardId, updates) => Promise
  addWidget,          // (widget) => Promise
  updateWidget,       // (widget) => Promise
  removeWidget,       // (widgetId) => Promise
  updateLayout,       // (layout) => Promise
  refreshDashboard,   // () => Promise
  refetch,            // Manual refetch function

  // Loading states
  isUpdating,         // Update operation in progress
  isAddingWidget,     // Add widget operation in progress
  isUpdatingWidget,   // Update widget operation in progress
  isRemovingWidget,   // Remove widget operation in progress
  isUpdatingLayout,   // Update layout operation in progress
  isRefreshing,       // Refresh operation in progress
}
```

**Example:**
```javascript
import { useDashboard } from '@/features/dashboard'

function MyDashboard() {
  const { dashboard, isLoading, addWidget } = useDashboard(userId)

  const handleAddWidget = () => {
    addWidget({
      type: 'metric_card',
      title: 'Total Weighings',
      position: { x: 0, y: 0, width: 4, height: 2 },
      config: { metric: 'total_weighings' },
      required_role: 'TIMBANGAN',
    })
  }

  if (isLoading) return <div>Loading...</div>

  return <div>{/* Render dashboard */}</div>
}
```

---

### 2. `useMetrics(userId, options)`

Hook for fetching metrics data.

**Parameters:**
- `userId` (string): User ID
- `options` (object): Query options
  - `autoRefresh` (boolean): Enable auto-refresh every 30s

**Returns:**
```javascript
{
  metrics,    // Metrics object
  isLoading,  // Loading state
  isError,    // Error state
  error,      // Error object
  refetch,    // Manual refetch function
}
```

**Related Hooks:**
- `useWeighingMetrics(options)` - Weighing-specific metrics
- `useSyncMetrics(options)` - Sync status metrics

**Example:**
```javascript
import { useMetrics } from '@/features/dashboard'

function MetricsPanel() {
  const { metrics, isLoading } = useMetrics(userId, { autoRefresh: true })

  if (isLoading) return <div>Loading metrics...</div>

  return (
    <div>
      {Object.entries(metrics).map(([key, metric]) => (
        <div key={key}>
          <h3>{metric.name}</h3>
          <p>{metric.value} {metric.unit}</p>
        </div>
      ))}
    </div>
  )
}
```

---

### 3. `useAnalytics()`

Hook for tracking analytics events.

**Returns:**
```javascript
{
  // Generic tracking
  trackEvent,          // (eventType, metadata) => void

  // Specific event tracking
  trackDashboardView,  // () => void
  trackWidgetClick,    // (widgetId, widgetType) => void
  trackWidgetRefresh,  // (widgetId) => void
  trackLayoutChange,   // () => void
  trackDataExport,     // (exportType, recordCount) => void

  isTracking,          // Tracking operation in progress
}
```

**Example:**
```javascript
import { useAnalytics } from '@/features/dashboard'

function DashboardPage() {
  const { trackDashboardView, trackWidgetClick } = useAnalytics()

  useEffect(() => {
    trackDashboardView()
  }, [])

  const handleWidgetClick = (widgetId, widgetType) => {
    trackWidgetClick(widgetId, widgetType)
  }

  return <div>{/* Dashboard content */}</div>
}
```

---

### 4. `useActivities(userId, limit)`

Hook for fetching recent user activities.

**Parameters:**
- `userId` (string): User ID
- `limit` (number): Number of activities to fetch (default: 10)

**Returns:**
```javascript
{
  activities, // Array of activity objects
  isLoading,  // Loading state
  isError,    // Error state
  error,      // Error object
  refetch,    // Manual refetch function
}
```

**Example:**
```javascript
import { useActivities } from '@/features/dashboard'

function ActivityFeed() {
  const { activities, isLoading } = useActivities(userId, 10)

  return (
    <div>
      {activities.map(activity => (
        <div key={activity.id}>
          <h4>{activity.title}</h4>
          <p>{activity.description}</p>
          <time>{activity.timestamp}</time>
        </div>
      ))}
    </div>
  )
}
```

---

### 5. `useSystemHealth(options)`

Hook for system health monitoring.

**Parameters:**
- `options` (object): Query options
  - `autoRefresh` (boolean): Enable auto-refresh every 30s

**Returns:**
```javascript
{
  // Raw data
  systemHealth,      // System health object

  // Derived state
  isHealthy,         // System is healthy
  isWarning,         // System has warnings
  isCritical,        // System is critical
  healthScore,       // Health score (0-100)

  // Services
  services,          // Services object
  serviceList,       // Array of service health objects
  healthyServices,   // Count of healthy services
  warningServices,   // Count of warning services
  criticalServices,  // Count of critical services

  // Query state
  isLoading,
  isError,
  error,
  refetch,
}
```

**Example:**
```javascript
import { useSystemHealth } from '@/features/dashboard'

function SystemHealthWidget() {
  const { isHealthy, healthScore, serviceList } = useSystemHealth({
    autoRefresh: true
  })

  return (
    <div>
      <h3>System Health: {healthScore}%</h3>
      <div className={isHealthy ? 'text-green-500' : 'text-red-500'}>
        {isHealthy ? '✓ Healthy' : '✗ Issues Detected'}
      </div>
      <ul>
        {serviceList.map(service => (
          <li key={service.name}>
            {service.name}: {service.status}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

### 6. `useWidgets(userId)`

Hook for widget management with advanced features.

**Parameters:**
- `userId` (string): User ID

**Returns:**
```javascript
{
  // Widget data
  widgets,              // All widgets array
  visibleWidgets,       // Visible widgets only
  selectedWidget,       // Currently selected widget ID
  isConfiguring,        // Configuration mode active

  // Widget queries
  getWidgetsByType,     // (type) => Widget[]
  getWidgetById,        // (widgetId) => Widget
  hasWidget,            // (widgetId) => boolean

  // Widget operations
  addWidget,            // (widgetData) => Promise<Widget>
  updateWidget,         // (widgetId, updates) => Promise<Widget>
  removeWidget,         // (widgetId) => Promise
  toggleWidgetVisibility, // (widgetId) => Promise
  updateWidgetPosition,   // (widgetId, position) => Promise
  updateWidgetConfig,     // (widgetId, config) => Promise

  // Widget selection
  selectWidget,         // (widgetId) => void
  deselectWidget,       // () => void

  // Templates
  widgetTemplates,      // Available widget templates
  createWidgetFromTemplate, // (templateName, customizations) => Promise<Widget>

  // Loading states
  isAddingWidget,
  isUpdatingWidget,
  isRemovingWidget,
}
```

**Example:**
```javascript
import { useWidgets } from '@/features/dashboard'

function WidgetManager() {
  const {
    visibleWidgets,
    createWidgetFromTemplate,
    removeWidget,
    widgetTemplates,
  } = useWidgets(userId)

  const addMetricCard = () => {
    createWidgetFromTemplate('metric_card', {
      title: 'Custom Metric',
      config: { metric: 'my_metric' },
    })
  }

  return (
    <div>
      <button onClick={addMetricCard}>Add Metric Card</button>

      <div className="widgets-grid">
        {visibleWidgets.map(widget => (
          <div key={widget.id}>
            <h3>{widget.title}</h3>
            <button onClick={() => removeWidget(widget.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div>
        <h4>Available Templates:</h4>
        <ul>
          {Object.keys(widgetTemplates).map(template => (
            <li key={template}>{template}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

---

## Advanced Usage

### Combining Multiple Hooks

```javascript
import {
  useDashboard,
  useMetrics,
  useAnalytics,
  useWidgets
} from '@/features/dashboard'

function AdvancedDashboard() {
  const { user } = useAuthStore()

  const { dashboard, isLoading } = useDashboard(user?.id)
  const { metrics } = useMetrics(user?.id, { autoRefresh: true })
  const { trackDashboardView, trackWidgetClick } = useAnalytics()
  const { visibleWidgets, createWidgetFromTemplate } = useWidgets(user?.id)

  useEffect(() => {
    trackDashboardView()
  }, [trackDashboardView])

  // Use all hooks together for a complete dashboard experience
}
```

### Auto-Refresh Pattern

```javascript
// Enable auto-refresh for real-time data
const { metrics } = useMetrics(userId, { autoRefresh: true })
const { systemHealth } = useSystemHealth({ autoRefresh: true })
```

### Optimistic Updates

```javascript
const { updateWidget } = useWidgets(userId)

// React Query automatically handles optimistic updates
const handleUpdateWidget = async (widgetId, updates) => {
  // UI updates immediately, reverts on error
  await updateWidget(widgetId, updates)
}
```

## Best Practices

1. **Use auto-refresh for real-time data**
   ```javascript
   useMetrics(userId, { autoRefresh: true })
   ```

2. **Track user interactions**
   ```javascript
   const { trackWidgetClick } = useAnalytics()
   <Widget onClick={() => trackWidgetClick(widget.id, widget.type)} />
   ```

3. **Handle loading states**
   ```javascript
   const { dashboard, isLoading, isError } = useDashboard(userId)
   if (isLoading) return <Loading />
   if (isError) return <Error />
   ```

4. **Use templates for consistent widgets**
   ```javascript
   const { createWidgetFromTemplate } = useWidgets(userId)
   createWidgetFromTemplate('metric_card', { title: 'My Metric' })
   ```

5. **Leverage React Query caching**
   - Data is automatically cached
   - Queries are deduplicated
   - Stale data is refetched in background

## Performance Tips

- Hooks use React Query for optimal caching
- Auto-refresh intervals are configurable
- Queries are automatically cancelled when component unmounts
- Multiple components can share the same query cache

## TypeScript Support

All hooks are written in JavaScript but can easily be converted to TypeScript for type safety.

## Related Documentation

- [React Query Documentation](https://tanstack.com/query/latest)
- [Frontend Architecture](../../../ARCHITECTURE.md)
- [Backend API Documentation](../../../../internal/dashboard/README.md)
