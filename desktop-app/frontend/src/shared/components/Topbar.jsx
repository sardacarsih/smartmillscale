import React from 'react'
import UserBadge from './UserBadge'

const Topbar = ({
  title = "Smart Mill Scale",
  subtitle = "",
  currentUser,
  onLogout,
  onNavigate
}) => {
  return (
    <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && (
              <span className="text-gray-400 text-sm">{subtitle}</span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <UserBadge
              user={currentUser}
              onLogout={onLogout}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar