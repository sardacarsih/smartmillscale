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
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-white sm:text-xl">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
            )}
          </div>

          <div className="flex justify-end">
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
