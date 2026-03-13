// Dashboard feature barrel exports

// Components
export { default as DashboardContainer } from './components/DashboardContainer'

// Widgets
export { default as WidgetCard } from './components/widgets/WidgetCard'
export { default as MetricCard } from './components/widgets/MetricCard'

// Role-specific Dashboards
export {
  AdminDashboard,
  SupervisorDashboard,
  TimbanganDashboard,
  GradingDashboard,
  RoleDashboard,
} from './components/role-dashboards'

// Hooks
export { useDashboard } from './hooks/useDashboard'
export { useMetrics } from './hooks/useMetrics'
export { useSystemHealth, useServiceHealth } from './hooks/useSystemHealth'
export { useWidgets } from './hooks/useWidgets'
