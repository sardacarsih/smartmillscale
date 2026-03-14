import React, { Suspense, lazy } from 'react'
import Timbang1Page from '../../features/timbang1/pages/Timbang1Page'
import { RoleDashboard } from '../../features/dashboard'
import { ProfilePage } from '../../features/profile'
import { HelpPage } from '../../features/help'
import { Notification, ErrorBoundary, PageShell } from '..'
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

  let pageContent = null

  switch (currentPage) {
    case 'profile':
      pageContent = (
        <ErrorBoundary>
          <ProfilePage {...commonProps} />
        </ErrorBoundary>
      )
      break

    case 'help':
      pageContent = (
        <ErrorBoundary>
          <HelpPage {...commonProps} />
        </ErrorBoundary>
      )
      break

    case 'settings':
      pageContent = (
        <ErrorBoundary>
          <SuspenseLoader message="Loading Settings...">
            <SettingsPage {...commonProps} />
          </SuspenseLoader>
        </ErrorBoundary>
      )
      break

    case 'timbang1':
      pageContent = (
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
      break

    case 'users':
      pageContent = (
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
      break

    case 'audit':
      pageContent = (
        <ErrorBoundary>
          <SuspenseLoader message="Loading Audit Log...">
            <AuditLogViewer {...commonProps} />
          </SuspenseLoader>
        </ErrorBoundary>
      )
      break

    case 'sync-management':
      pageContent = (
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
      break

    case 'master-data':
      pageContent = (
        <ErrorBoundary>
          <SuspenseLoader message="Loading Master Data...">
            <MasterDataPage {...commonProps} />
          </SuspenseLoader>
        </ErrorBoundary>
      )
      break

    case 'pks-reports':
      pageContent = (
        <ErrorBoundary>
          <PageShell
            title="Smart Mill Scale"
            subtitle="Laporan PKS"
            currentUser={user}
            onLogout={onLogout}
            onNavigate={onNavigate}
            pageTitle="Laporan PKS"
            pageDescription="Analisis transaksi, tren, dan performa operasional."
            contentWidth="full"
          >
            <SuspenseLoader message="Loading PKS Reports...">
              <PKSReportsPage {...commonProps} />
            </SuspenseLoader>
          </PageShell>
        </ErrorBoundary>
      )
      break

    // Default: Dashboard
    default:
      pageContent = (
        <ErrorBoundary>
          <PageShell
            title="Smart Mill Scale"
            subtitle="Database-Only Mode"
            currentUser={user}
            onLogout={onLogout}
            onNavigate={onNavigate}
            contentWidth="wide"
          >
            <RoleDashboard wails={wails} />
          </PageShell>
        </ErrorBoundary>
      )
      break
  }

  return (
    <>
      {pageContent}
      <Notification
        notifications={notifications}
        onRemove={onRemoveNotification}
        onClearAll={onClearAllNotifications}
      />
    </>
  )
}

export default AppRouter
