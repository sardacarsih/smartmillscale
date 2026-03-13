/**
 * SupervisorDashboard - Dashboard for SUPERVISOR role
 * Access to monitoring, reports, and limited management features
 */
import { useAuthStore } from '../../../auth'
import {
  useDashboard,
  useMetrics
} from '../../hooks'
import WidgetCard from '../widgets/WidgetCard'
import MetricCard from '../widgets/MetricCard'
import { SupervisorWeightWidget } from '../../../../shared/components/dashboard'
import { useNavigationStore } from '../../../../shared/store/useNavigationStore'

const SupervisorDashboard = ({ wails }) => {
  const { user } = useAuthStore()
  const { navigateTo } = useNavigationStore()

  // Fetch data
  const { dashboard, isLoading: dashboardLoading } = useDashboard(user?.id)
  const { metrics, isLoading: metricsLoading } = useMetrics(user?.id, { autoRefresh: true })

  // Mock recent activities
  const activities = [
    {
      id: 1,
      title: 'Weight Recorded',
      description: 'New vehicle weight recorded successfully',
      timestamp: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 2,
      title: 'System Sync',
      description: 'Data synchronization completed',
      timestamp: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: 3,
      title: 'User Activity',
      description: 'Operator login detected',
      timestamp: new Date(Date.now() - 900000).toISOString()
    }
  ]

  if (dashboardLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading supervisor dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Supervisor Dashboard</h1>
        <p className="text-gray-400 mt-1">Monitoring and reporting overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics && Object.entries(metrics).map(([key, metric]) => (
          <MetricCard key={key} metric={metric} />
        ))}
      </div>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weight Widget - Sidebar */}
        <div className="lg:col-span-1">
          <SupervisorWeightWidget wails={wails} />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weighing Statistics */}
          <WidgetCard isRefreshable>
            <WidgetCard.Header>
              <WidgetCard.Title>Weighing Statistics</WidgetCard.Title>
              <WidgetCard.Subtitle>Last 24 hours</WidgetCard.Subtitle>
            </WidgetCard.Header>
            <WidgetCard.Body>
              <div className="space-y-4">
                {metrics && Object.entries(metrics).map(([key, metric]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{metric.name}</span>
                    <span className="text-lg font-semibold text-white">
                      {metric.value} {metric.unit}
                    </span>
                  </div>
                ))}
              </div>
            </WidgetCard.Body>
          </WidgetCard>

          {/* Recent Activity */}
          <WidgetCard isRefreshable>
            <WidgetCard.Header>
              <WidgetCard.Title>Recent Activity</WidgetCard.Title>
              <WidgetCard.Subtitle>System events</WidgetCard.Subtitle>
            </WidgetCard.Header>
            <WidgetCard.Body>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities && activities.length > 0 ? (
                  activities.map(activity => (
                    <div key={activity.id} className="border-l-2 border-blue-600 pl-3">
                      <p className="text-sm text-white font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <WidgetCard.Empty />
                )}
              </div>
            </WidgetCard.Body>
          </WidgetCard>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigateTo('audit')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          View Audit Logs
        </button>
        <button
          onClick={() => navigateTo('master-data')}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Master Data
        </button>
        <button
          onClick={() => navigateTo('timbang1')}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Weighing Operations
        </button>
      </div>
    </div>
  )
}

export default SupervisorDashboard
