/**
 * MetricCard Widget Component
 * Displays a single metric with optional trend information
 */
import { formatWeight, formatPercentage } from '../../../../shared/utils'

const MetricCard = ({ metric, onClick }) => {
  if (!metric) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400">No metric data</p>
      </div>
    )
  }

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return '→'
    }
  }

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div
      className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Metric Name */}
      <h3 className="text-sm text-gray-400 mb-2 font-medium">
        {metric.name}
      </h3>

      {/* Metric Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">
          {typeof metric.value === 'number' ? metric.value.toLocaleString('id-ID') : metric.value}
        </span>
        {metric.unit && (
          <span className="text-lg text-gray-400">
            {metric.unit}
          </span>
        )}
      </div>

      {/* Trend Information */}
      {metric.trend && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor(metric.trend.direction)}`}>
          <span className="font-bold">
            {getTrendIcon(metric.trend.direction)}
          </span>
          <span>
            {metric.trend.percent}%
          </span>
          <span className="text-gray-500">
            ({metric.trend.period})
          </span>
        </div>
      )}

      {/* Additional Metadata */}
      {metric.metadata && Object.keys(metric.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-500 space-y-1">
            {Object.entries(metric.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-medium text-gray-400">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MetricCard
