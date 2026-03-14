/**
 * TimbanganDashboard - Dashboard for TIMBANGAN (Weighing Operator) role
 * Focus on weighing operations and recent weighing history
 */
import { useAuthStore } from '../../../auth'
import {
  useDashboard,
  useMetrics
} from '../../hooks'
import MetricCard from '../widgets/MetricCard'
import { RealTimeWeightChart, WeightTrendChart } from '../charts'
import { ResponsiveChartGrid } from '../ResponsiveGrid'
import { OperatorWeightWidget } from '../../../../shared/components/dashboard'
import { useNavigationStore } from '../../../../shared/store/useNavigationStore'

const TimbanganDashboard = ({ wails }) => {
  const { user } = useAuthStore()
  const { navigateTo } = useNavigationStore()

  // Fetch data
  const { dashboard, isLoading: dashboardLoading } = useDashboard(user?.id)
  const { metrics, isLoading: metricsLoading } = useMetrics(user?.id, { autoRefresh: true })


  if (dashboardLoading || metricsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading weighing dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Weighing Dashboard</h1>
        <p className="text-gray-400 mt-1">Operator weighing operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics && Object.entries(metrics).map(([key, metric]) => (
          <MetricCard key={key} metric={metric} />
        ))}
      </div>

      {/* Weight Monitoring Widget - Large Operational Display */}
      <div className="max-w-3xl mx-auto">
        <OperatorWeightWidget wails={wails} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => navigateTo('timbang1')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Start Weighing
              </button>
              <button
                onClick={() => navigateTo('profile')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                My Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Charts for Operators */}
      <ResponsiveChartGrid>
        <RealTimeWeightChart
          title="Live Weight Monitor"
          height={300}
          maxDataPoints={20}
          updateInterval={1500}
        />

        <WeightTrendChart
          title="Today's Weighing Trends"
          height={300}
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
    </div>
  )
}

export default TimbanganDashboard
