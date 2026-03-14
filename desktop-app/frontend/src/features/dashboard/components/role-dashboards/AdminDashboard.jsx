/**
 * AdminDashboard - Dashboard for ADMIN role
 * Full access to all features including system health, and analytics
 */
import { useAuthStore } from '../../../auth'
import {
  useDashboard,
  useMetrics,
  useSystemHealth
} from '../../hooks'
import { useAuditLogs } from '../../../../shared/hooks'
import WidgetCard from '../widgets/WidgetCard'
import MetricCard from '../widgets/MetricCard'
import {
  WeightTrendChart,
  RealTimeWeightChart,
  VehicleTypeChart,
  HourlyActivityChart
} from '../charts'
import { ResponsiveChartGrid, ResponsiveMetricGrid } from '../ResponsiveGrid'
import { AdminWeightWidget } from '../../../../shared/components/dashboard'
import { useNavigationStore } from '../../../../shared/store/useNavigationStore'

const AdminDashboard = ({ wails }) => {
  const { user } = useAuthStore()
  const { navigateTo } = useNavigationStore()

  // Fetch data
  const { dashboard, isLoading: dashboardLoading } = useDashboard(user?.id)
  const { metrics, isLoading: metricsLoading } = useMetrics(user?.id, { autoRefresh: true, enabled: !!user })
  const { health, isLoading: healthLoading } = useSystemHealth({ autoRefresh: true, enabled: !!user })
  const { logs: activities, isLoading: activitiesLoading } = useAuditLogs(10, 0, { enabled: !!user })

  // Transform health data for component use
  const healthScore = health?.score || 0
  const systemHealth = health
  const serviceList = health?.services ? Object.entries(health.services).map(([name, data]) => ({ name, ...data })) : []

  if (dashboardLoading || metricsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Complete system overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${healthScore >= 80 ? 'bg-green-900/30 text-green-400' :
            healthScore >= 50 ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-red-900/30 text-red-400'
            }`}>
            <div className={`w-2 h-2 rounded-full ${healthScore >= 80 ? 'bg-green-500' :
              healthScore >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              } animate-pulse`}></div>
            <span className="text-sm font-medium">System Health: {healthScore}%</span>
          </div>
        </div>
      </div>

      {/* Weight Monitoring Widget - Full Analytics */}
      <AdminWeightWidget wails={wails} />

      {/* Key Metrics Grid */}
      <ResponsiveMetricGrid>
        {metrics && Object.entries(metrics).slice(0, 4).map(([key, metric]) => (
          <MetricCard key={key} metric={metric} />
        ))}
      </ResponsiveMetricGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Widget */}
        <WidgetCard className="lg:col-span-1" isRefreshable isConfigurable={false}>
          <WidgetCard.Header>
            <WidgetCard.Title>System Health</WidgetCard.Title>
            <WidgetCard.Subtitle>Service status monitoring</WidgetCard.Subtitle>
          </WidgetCard.Header>
          <WidgetCard.Body>
            <div className="space-y-3">
              {serviceList && serviceList.length > 0 ? (
                serviceList.map(service => (
                  <div key={service.name} className="flex justify-between items-center">
                    <span className="text-sm text-gray-300 capitalize">
                      {service.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${service.status === 'healthy' ? 'bg-green-900/50 text-green-400' :
                      service.status === 'warning' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                      {service.status}
                    </span>
                  </div>
                ))
              ) : (
                <WidgetCard.Empty message="No service data available" />
              )}
            </div>
          </WidgetCard.Body>
          <WidgetCard.Footer>
            <div className="text-xs text-gray-500">
              Last checked: {systemHealth?.last_checked ? new Date(systemHealth.last_checked).toLocaleTimeString() : 'N/A'}
            </div>
          </WidgetCard.Footer>
        </WidgetCard>

        {/* Recent Activity Widget */}
        <WidgetCard className="lg:col-span-1" isRefreshable isConfigurable={false}>
          <WidgetCard.Header>
            <WidgetCard.Title>Recent Activity</WidgetCard.Title>
            <WidgetCard.Subtitle>Last 10 actions</WidgetCard.Subtitle>
          </WidgetCard.Header>
          <WidgetCard.Body>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-gray-400">Loading activities...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
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
                  <WidgetCard.Empty message="No recent activity" />
                )}
              </div>
            )}
          </WidgetCard.Body>
        </WidgetCard>

        {/* Quick Actions Widget */}
        <WidgetCard className="lg:col-span-1" isRefreshable={false} isConfigurable={false}>
          <WidgetCard.Header>
            <WidgetCard.Title>Quick Actions</WidgetCard.Title>
            <WidgetCard.Subtitle>Admin tools</WidgetCard.Subtitle>
          </WidgetCard.Header>
          <WidgetCard.Body>
            <div className="space-y-2">
              <button
                onClick={() => navigateTo('audit')}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                View Audit Logs
              </button>
              <button
                onClick={() => navigateTo('sync-management')}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                Sync Management
              </button>
              <button
                onClick={() => navigateTo('settings')}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                System Settings
              </button>
              <button
                onClick={() => navigateTo('master-data')}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                Master Data
              </button>
              <button
                onClick={() => navigateTo('users')}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                User Management
              </button>
            </div>
          </WidgetCard.Body>
        </WidgetCard>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Real-time Weight Monitoring */}
        <ResponsiveChartGrid>
          <RealTimeWeightChart
            title="Live Weight Monitor"
            height={350}
            maxDataPoints={30}
            updateInterval={2000}
          />

          {/* Weight Trends */}
          <WeightTrendChart
            title="Recent Weight Trends"
            height={350}
            data={[
              { timestamp: Date.now() - 3600000, weight: 4250 },
              { timestamp: Date.now() - 3000000, weight: 4380 },
              { timestamp: Date.now() - 2400000, weight: 4120 },
              { timestamp: Date.now() - 1800000, weight: 4450 },
              { timestamp: Date.now() - 1200000, weight: 4680 },
              { timestamp: Date.now() - 600000, weight: 4390 },
              { timestamp: Date.now(), weight: 4520 },
            ]}
          />
        </ResponsiveChartGrid>

        {/* Statistics Charts */}
        <ResponsiveChartGrid>
          <VehicleTypeChart
            data={[
              { type: 'Truck', count: 45, percentage: 45 },
              { type: 'Pickup', count: 30, percentage: 30 },
              { type: 'Container', count: 15, percentage: 15 },
              { type: 'Other', count: 10, percentage: 10 },
            ]}
          />

          <HourlyActivityChart
            data={[
              { hour: '06:00', count: 12 },
              { hour: '08:00', count: 28 },
              { hour: '10:00', count: 35 },
              { hour: '12:00', count: 22 },
              { hour: '14:00', count: 18 },
              { hour: '16:00', count: 25 },
              { hour: '18:00', count: 15 },
            ]}
          />
        </ResponsiveChartGrid>
      </div>

      {/* Additional Metrics */}
      {metrics && Object.keys(metrics).length > 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(metrics).slice(4).map(([key, metric]) => (
            <MetricCard key={key} metric={metric} />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
