/**
 * DashboardContainer - Main container component demonstrating hook usage
 */
import { useEffect } from 'react'
import { useAuthStore } from '../../auth'
import {
  useDashboard,
  useMetrics,
  useSystemHealth,
  useWidgets
} from '../hooks'

const DashboardContainer = ({ wails }) => {
  const { user } = useAuthStore()

  // Fetch dashboard data
  const {
    dashboard,
    isLoading: isDashboardLoading,
    refreshDashboard,
  } = useDashboard(user?.id)

  // Fetch metrics with auto-refresh
  const {
    metrics,
    isLoading: isMetricsLoading,
  } = useMetrics(user?.id, { autoRefresh: true })

  // Fetch system health (for admin/supervisor)
  const {
    systemHealth,
    isHealthy,
    healthScore,
  } = useSystemHealth({
    autoRefresh: user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'
  })

  // Manage widgets
  const {
    visibleWidgets,
    addWidget,
    updateWidget,
    removeWidget,
  } = useWidgets(user?.id)


  if (isDashboardLoading || isMetricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.full_name}</p>
          </div>

          {/* System Health Indicator */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && systemHealth && (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
              <span className="text-sm">
                System Health: {healthScore}%
              </span>
            </div>
          )}

          <button
            onClick={refreshDashboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(metrics).map(([key, metric]) => (
            <div key={key} className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-sm text-gray-400 mb-2">{metric.name}</h3>
              <div className="text-3xl font-bold">
                {metric.value} {metric.unit}
              </div>
              {metric.trend && (
                <div className={`text-sm mt-2 ${metric.trend.direction === 'up' ? 'text-green-400' :
                  metric.trend.direction === 'down' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                  {metric.trend.direction === 'up' ? '↑' :
                    metric.trend.direction === 'down' ? '↓' : '→'}
                  {metric.trend.percent}% ({metric.trend.period})
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-12 gap-4">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.id}
            className={`bg-gray-800 rounded-lg p-6 col-span-${widget.position.width} row-span-${widget.position.height}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{widget.title}</h3>
              <div className="flex gap-2">
                {widget.refreshable && (
                  <button
                    className="text-gray-400 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Refresh widget logic
                    }}
                  >
                    ↻
                  </button>
                )}
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeWidget(widget.id)
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div>
              {/* Widget content would be rendered here based on widget.type */}
              <p className="text-gray-400">Widget Type: {widget.type}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Widget Button */}
      <div className="mt-8">
        <button
          onClick={() => {
            // Show widget picker modal
            console.log('Add widget clicked')
          }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          + Add Widget
        </button>
      </div>
    </div>
  )
}

export default DashboardContainer
