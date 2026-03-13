/**
 * WeightTrendChart - Line chart showing weight trends over time
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const WeightTrendChart = ({ data = [], height = 300, title = "Weight Trends" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">No trend data available</p>
        </div>
      </div>
    )
  }

  // Format data for recharts
  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    weight: Number(item.weight) || 0,
    date: new Date(item.timestamp).toLocaleDateString('id-ID')
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-medium">{`Time: ${label}`}</p>
          <p className="text-blue-400 text-sm">{`Weight: ${payload[0].value.toLocaleString('id-ID')} kg`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-400">Weight (kg)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Weight (kg)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeightTrendChart