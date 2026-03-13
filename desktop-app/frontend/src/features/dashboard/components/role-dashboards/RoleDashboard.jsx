/**
 * RoleDashboard - Smart dashboard router based on user role
 * Automatically renders the appropriate dashboard for the user's role
 * Weight monitoring is managed globally at the App level
 */
import { useAuthStore } from '../../../auth'
import { USER_ROLES } from '../../../../shared/constants'
import AdminDashboard from './AdminDashboard'
import SupervisorDashboard from './SupervisorDashboard'
import TimbanganDashboard from './TimbanganDashboard'
import GradingDashboard from './GradingDashboard'
import SessionTimeoutWarning from '../SessionTimeoutWarning'

const RoleDashboard = ({ wails }) => {
  const { user, isAuthenticated } = useAuthStore()

  console.log('[RoleDashboard] Rendering with:', { wails: !!wails, user: user?.username, role: user?.role, isAuthenticated })

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white text-lg">Please log in to view your dashboard</p>
        </div>
      </div>
    )
  }

  // Route to appropriate dashboard based on role
  const renderDashboard = () => {
    // Normalize role to uppercase for consistent comparison
    const normalizedRole = user.role?.toUpperCase()
    console.log('[RoleDashboard] renderDashboard called for role:', user.role, 'normalized:', normalizedRole)
    switch (normalizedRole) {
      case USER_ROLES.ADMIN:
        console.log('[RoleDashboard] Rendering AdminDashboard')
        return <AdminDashboard wails={wails} />

      case USER_ROLES.SUPERVISOR:
        console.log('[RoleDashboard] Rendering SupervisorDashboard')
        return <SupervisorDashboard wails={wails} />

      case USER_ROLES.TIMBANGAN:
        console.log('[RoleDashboard] Rendering TimbanganDashboard')
        return <TimbanganDashboard wails={wails} />

      case USER_ROLES.GRADING:
        console.log('[RoleDashboard] Rendering GradingDashboard')
        return <GradingDashboard wails={wails} />

      default:
        console.error('[RoleDashboard] Invalid role:', user.role, 'normalized:', normalizedRole)
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-red-400 text-lg">Invalid user role: {user.role}</p>
              <p className="text-gray-400 mt-2">Expected one of: ADMIN, SUPERVISOR, TIMBANGAN, GRADING</p>
              <p className="text-gray-500 text-sm mt-2">Please contact your administrator</p>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      {renderDashboard()}
      <SessionTimeoutWarning />
    </>
  )
}

export default RoleDashboard
