/**
 * StatisticsChart - Bar and pie charts for various statistics
 * Supports multiple chart types for different analytics views
 */
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6']

const StatisticsChart = ({
  type = 'bar',
  data = [],
  height = 300,
  title = "Statistics",
  dataKey = 'value',
  nameKey = 'name'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">No statistics data available</p>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-medium">{label || payload[0].name}</p>
          <p className="text-blue-400 text-sm">{`Value: ${payload[0].value.toLocaleString('id-ID')}`}</p>
          {payload[0].payload.percentage && (
            <p className="text-gray-400 text-sm">{`Percentage: ${payload[0].payload.percentage}%`}</p>
          )}
        </div>
      )
    }
    return null
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey={nameKey}
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey={dataKey}
          fill="#3B82F6"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart()
      case 'bar':
      default:
        return renderBarChart()
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 capitalize">{type} Chart</span>
        </div>
      </div>

      {renderChart()}

      {/* Summary Statistics */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total:</span>
              <span className="ml-2 text-white font-medium">
                {data.reduce((sum, item) => sum + (item[dataKey] || 0), 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Average:</span>
              <span className="ml-2 text-white font-medium">
                {Math.round(data.reduce((sum, item) => sum + (item[dataKey] || 0), 0) / data.length).toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Maximum:</span>
              <span className="ml-2 text-white font-medium">
                {Math.max(...data.map(item => item[dataKey] || 0)).toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Items:</span>
              <span className="ml-2 text-white font-medium">{data.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Pre-configured statistics chart components
export const VehicleTypeChart = ({ data }) => (
  <StatisticsChart
    type="pie"
    title="Vehicle Types Distribution"
    data={data}
    dataKey="count"
    nameKey="type"
  />
)

export const HourlyActivityChart = ({ data }) => (
  <StatisticsChart
    type="bar"
    title="Hourly Weighing Activity"
    data={data}
    dataKey="count"
    nameKey="hour"
  />
)

export const DailyVolumeChart = ({ data }) => (
  <StatisticsChart
    type="bar"
    title="Daily Weighing Volume"
    data={data}
    dataKey="weight"
    nameKey="date"
  />
)

export default StatisticsChart