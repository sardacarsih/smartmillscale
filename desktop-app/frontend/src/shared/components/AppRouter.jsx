import React, { Suspense, lazy } from 'react'
import Timbang1Page from '../../features/timbang1/pages/Timbang1Page'
import { RoleDashboard } from '../../features/dashboard'
import { ProfilePage } from '../../features/profile'
import { HelpPage } from '../../features/help'
import { Notification, ErrorBoundary, Topbar } from '..'
import ServiceBoundary from './ServiceBoundary'
import LoadingScreen from './LoadingScreen'

// Lazy load large feature components
const AuditLogViewer = lazy(() => import('../../features/audit').then(module => ({ default: module.AuditLogViewer })))
const UserManagementMUI = lazy(() => import('../../features/user-management').then(module => ({ default: module.UserManagementMUI })))
const MasterDataPage = lazy(() => import('../../features/master-data').then(module => ({ default: module.MasterDataPage })))
const PKSReportsPage = lazy(() => import('../../features/reporting').then(module => ({ default: module.PKSReportsPage })))
const SettingsPage = lazy(() => import('../../features/settings').then(module => ({ default: module.SettingsPage })))
const SyncManagementPage = lazy(() => import('../../features/sync-management').then(module => ({ default: module.SyncManagementPage })))

const SuspenseLoader = ({ message, children }) => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{message}</p>
        </div>
      </div>
    }
  >
    {children}
  </Suspense>
)

/**
 * AppRouter handles all authenticated page routing.
 * Reduces App.jsx complexity by extracting the page rendering logic.
 */
const AppRouter = ({
  currentPage,
  user,
  wails,
  isAuthenticated,
  servicesInitialized,
  onNavigate,
  onLogout,
  notifications,
  onRemoveNotification,
  onClearAllNotifications
}) => {
  const commonProps = {
    currentUser: user,
    wails,
    onNavigate,
    onLogout
  }

  switch (currentPage) {
    case 'profile':
      return (
        <ErrorBoundary>
          <ProfilePage {...commonProps} />
        </ErrorBoundary>
      )

    case 'help':
      return (
        <ErrorBoundary>
          <HelpPage {...commonProps} />
        </ErrorBoundary>
      )

    case 'settings':
      return (
        <ErrorBoundary>
          <SuspenseLoader message="Loading Settings...">
            <SettingsPage {...commonProps} />
          </SuspenseLoader>
        </ErrorBoundary>
      )

    case 'timbang1':
      return (
        <ErrorBoundary>
          <ServiceBoundary
            isAuthenticated={isAuthenticated}
            servicesReady={servicesInitialized}
            featureName="Weighing System"
          >
            <Timbang1Page {...commonProps} />
          </ServiceBoundary>
        </ErrorBoundary>
      )

    case 'users':
      return (
        <ErrorBoundary>
          <ServiceBoundary
            isAuthenticated={isAuthenticated}
            servicesReady={servicesInitialized}
            featureName="User Management"
          >
            <SuspenseLoader message="Loading User Management...">
              <UserManagementMUI {...commonProps} />
            </SuspenseLoader>
          </ServiceBoundary>
        </ErrorBoundary>
      )

    case 'audit':
      return (
        <ErrorBoundary>
          <SuspenseLoader message="Loading Audit Log...">
            <AuditLogViewer {...commonProps} />
          </SuspenseLoader>
        </ErrorBoundary>
      )

    case 'sync-management':
      return (
        <ErrorBoundary>
          <ServiceBoundary
            isAuthenticated={isAuthenticated}
            servicesReady={servicesInitialized}
            featureName="Sync Management"
          >
            <SuspenseLoader message="Loading Sync Management...">
              <SyncManagementPage {...commonProps} />
            </SuspenseLoader>
          </ServiceBoundary>
        </ErrorBoundary>
      )

    case 'master-data':
      return (
        <ErrorBoundary>
          <SuspenseLoader message="Loading Master Data...">
            <MasterDataPage {...commonProps} />
          </SuspenseLoader>
        </ErrorBoundary>
      )

    case 'pks-reports':
      return (
        <ErrorBoundary>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <Topbar
              title="Smart Mill Scale"
              subtitle="Laporan PKS"
              currentUser={user}
              onLogout={onLogout}
              onNavigate={onNavigate}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <SuspenseLoader message="Loading PKS Reports...">
                <PKSReportsPage {...commonProps} />
              </SuspenseLoader>
            </main>
            <Notification
              notifications={notifications}
              onRemove={onRemoveNotification}
              onClearAll={onClearAllNotifications}
            />
          </div>
        </ErrorBoundary>
      )

    // Default: Dashboard
    default:
      return (
        <ErrorBoundary>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <Topbar
              title="Smart Mill Scale"
              subtitle="Database-Only Mode"
              currentUser={user}
              onLogout={onLogout}
              onNavigate={onNavigate}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <RoleDashboard wails={wails} />
            </main>
            <Notification
              notifications={notifications}
              onRemove={onRemoveNotification}
              onClearAll={onClearAllNotifications}
            />
          </div>
        </ErrorBoundary>
      )
  }
}

export default AppRouter
