/**
 * GradingDashboard - Dashboard for GRADING role
 * Read-only view of weighing data and reports
 */
import { useAuthStore } from '../../../auth'
import {
  useDashboard,
  useMetrics
} from '../../hooks'
import WidgetCard from '../widgets/WidgetCard'
import MetricCard from '../widgets/MetricCard'
import { GradingWeightWidget } from '../../../../shared/components/dashboard'
import { useNavigationStore } from '../../../../shared/store/useNavigationStore'

const GradingDashboard = ({ wails }) => {
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
      description: 'Vehicle weight: 4,250 kg',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'weighing.recorded'
    },
    {
      id: 2,
      title: 'Grading Completed',
      description: 'Quality grade A assigned',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: 'grading.completed'
    },
    {
      id: 3,
      title: 'WEIGHING',
      description: 'New weighing session started',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      type: 'WEIGHING'
    }
  ]

  if (dashboardLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading grading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Grading Dashboard</h1>
        <p className="text-gray-400 mt-1">View-only weighing data</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics && Object.entries(metrics).map(([key, metric]) => (
          <MetricCard key={key} metric={metric} />
        ))}
      </div>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weight Information Widget - Read-only */}
        <div className="lg:col-span-1">
          <GradingWeightWidget wails={wails} />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Weighings Summary */}
          <WidgetCard isRefreshable isRemovable={false}>
            <WidgetCard.Header>
              <WidgetCard.Title>Recent Weighings</WidgetCard.Title>
              <WidgetCard.Subtitle>Latest recorded data</WidgetCard.Subtitle>
            </WidgetCard.Header>
            <WidgetCard.Body>
              <div className="space-y-3">
                {activities && activities.length > 0 ? (
                  activities
                    .filter(a => a.type === 'weighing.recorded' || a.type === 'WEIGHING')
                    .slice(0, 5)
                    .map(activity => (
                      <div key={activity.id} className="bg-gray-700 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-white font-medium">{activity.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <WidgetCard.Empty message="No recent weighings" />
                )}
              </div>
            </WidgetCard.Body>
            <WidgetCard.Footer>
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View all weighings →
              </button>
            </WidgetCard.Footer>
          </WidgetCard>

          {/* Daily Summary */}
          <WidgetCard isRefreshable isRemovable={false}>
            <WidgetCard.Header>
              <WidgetCard.Title>Daily Summary</WidgetCard.Title>
              <WidgetCard.Subtitle>Today's statistics</WidgetCard.Subtitle>
            </WidgetCard.Header>
            <WidgetCard.Body>
              <div className="space-y-4">
                {metrics && Object.entries(metrics).slice(0, 3).map(([key, metric]) => (
                  <div key={key} className="flex justify-between items-center pb-3 border-b border-gray-700 last:border-0">
                    <span className="text-sm text-gray-300">{metric.name}</span>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {metric.value} {metric.unit}
                      </p>
                      {metric.trend && (
                        <p className={`text-xs ${metric.trend.direction === 'up' ? 'text-green-400' :
                          metric.trend.direction === 'down' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                          {metric.trend.direction === 'up' ? '↑' :
                            metric.trend.direction === 'down' ? '↓' : '→'}
                          {metric.trend.percent}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </WidgetCard.Body>
          </WidgetCard>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-300 font-medium">Read-Only Access</p>
            <p className="text-xs text-blue-400/70 mt-1">
              You have view-only access to this dashboard. Contact your supervisor for additional permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigateTo('help')}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          View Help & Documentation
        </button>
        <button
          onClick={() => navigateTo('profile')}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          My Profile
        </button>
      </div>
    </div>
  )
}

export default GradingDashboard
