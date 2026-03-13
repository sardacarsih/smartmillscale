import React from 'react'

const UserStatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  return (
    <div className={`p-4 bg-gray-800/50 backdrop-blur-sm border rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
    </div>
  )
}

export default UserStatsCard