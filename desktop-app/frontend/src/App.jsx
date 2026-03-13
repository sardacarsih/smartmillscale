import React, { useEffect, useState, useMemo, useCallback } from 'react'
// Feature imports
import { LoginPage, LockScreen, useAuthStore } from './features/auth'
// Shared imports
import { ErrorBoundary, useNotificationStore } from './shared'
import { useWeightMonitoring } from './shared/hooks'
import useNavigationStore from './shared/store/useNavigationStore'
import useGlobalWeightStore from './shared/store/useGlobalWeightStore'
import { WailsProvider } from './shared/contexts/WailsContext'
import { UserService } from './shared/services/UserService'
import LoadingScreen from './shared/components/LoadingScreen'
import AppRouter from './shared/components/AppRouter'
import useSessionTimeout from './shared/hooks/useSessionTimeout'
// Import Wails wrapper
import { getWailsWrapper } from './shared/lib/wailsWrapper'

function App() {
  const {
    isAuthenticated,
    isLoading,
    user,
    logout,
    error: authError,
    clearError
  } = useAuthStore()

  const {
    notifications,
    removeNotification,
    clearAllNotifications
  } = useNotificationStore()

  const {
    currentPage,
    navigateTo,
    canAccessPage
  } = useNavigationStore()

  const [isLocked, setIsLocked] = useState(false)
  const [wails, setWails] = useState(null)
  const [wailsReady, setWailsReady] = useState(false)
  const [servicesInitialized, setServicesInitialized] = useState(false)
  const [isInitializingServices, setIsInitializingServices] = useState(false)

  // Create userService instance from wails when available
  const userService = useMemo(() => wails ? new UserService(wails) : null, [wails])

  // Navigation handler
  const handleNavigation = useCallback((page) => {
    if (!canAccessPage(page, user?.role)) {
      console.warn(`Access denied for page: ${page}, user role: ${user?.role}`)
      return
    }
    navigateTo(page)
  }, [canAccessPage, user?.role, navigateTo])

  // Logout handler
  const handleLogout = useCallback(() => {
    logout(userService)
  }, [logout, userService])

  // Lock handler
  const handleLock = useCallback(() => {
    setIsLocked(true)
  }, [])

  // Session timeout management
  useSessionTimeout({
    isAuthenticated,
    user,
    wails,
    onLock: handleLock
  })

  // Initialize Wails wrapper with retry
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 50

    const checkWails = () => {
      attempts++

      try {
        const wrapper = getWailsWrapper(true)

        if (wrapper && typeof wrapper === 'object') {
          console.log('Wails bindings ready, wrapper type:', wrapper.isMock ? 'mock' : 'native')
          setWails(wrapper)
          setWailsReady(true)
          return
        }
      } catch (error) {
        console.error(`Error in checkWails (attempt ${attempts}):`, error.message)
      }

      if (attempts < maxAttempts) {
        setTimeout(checkWails, 100)
      } else {
        console.error('Failed to initialize Wails after', maxAttempts, 'attempts')
      }
    }

    checkWails()
  }, [])

  // Clear stale errors when showing login page
  useEffect(() => {
    if (!isAuthenticated && authError) {
      clearError()
    }
  }, [isAuthenticated, authError, clearError])

  // Force stop monitoring on logout
  useEffect(() => {
    if (!isAuthenticated && !user) {
      const { stopMonitoring, setPersistent } = useGlobalWeightStore.getState()
      setPersistent(false)
      stopMonitoring(null, { force: true })
    }
  }, [isAuthenticated, user])

  // Handle service initialization state
  useEffect(() => {
    if (isAuthenticated && user && !servicesInitialized && !isInitializingServices) {
      setIsInitializingServices(true)

      setTimeout(() => {
        setServicesInitialized(true)
        setIsInitializingServices(false)
      }, 1000)
    } else if (!isAuthenticated && servicesInitialized) {
      setServicesInitialized(false)
      setIsInitializingServices(false)
    }
  }, [isAuthenticated, user, servicesInitialized, isInitializingServices])

  // Global weight monitoring - stays active across all pages
  useWeightMonitoring({
    wails,
    role: user?.role,
    autoStart: isAuthenticated && servicesInitialized,
    autoCleanup: false
  })

  // Enable persistence to prevent accidental stopping during navigation
  useEffect(() => {
    if (isAuthenticated) {
      const { setPersistent } = useGlobalWeightStore.getState()
      setPersistent(true)
    }
  }, [isAuthenticated])

  // Loading states
  if (!wailsReady || !wails) {
    return <LoadingScreen message="Initializing Smart Mill Scale..." subtitle="Loading core services..." />
  }

  if (isInitializingServices) {
    return (
      <LoadingScreen
        wails={wails}
        message="Initializing User Services..."
        subtitle={`Setting up authenticated services for ${user?.fullName || user?.username}...`}
      />
    )
  }

  if (isLoading) {
    return <LoadingScreen wails={wails} message="Initializing Smart Mill Scale..." subtitle="Connecting to database..." />
  }

  // Handle locked screen
  if (isLocked && isAuthenticated) {
    return (
      <WailsProvider wails={wails}>
        <ErrorBoundary>
          <LockScreen
            user={user}
            onUnlockSuccess={() => setIsLocked(false)}
            onLogout={() => {
              handleLogout()
              setIsLocked(false)
            }}
            wails={wails}
            userService={userService}
          />
        </ErrorBoundary>
      </WailsProvider>
    )
  }

  // Login page
  if (!isAuthenticated) {
    return (
      <WailsProvider wails={wails}>
        <ErrorBoundary>
          <LoginPage wails={wails} />
        </ErrorBoundary>
      </WailsProvider>
    )
  }

  // Authenticated page routing
  return (
    <WailsProvider wails={wails}>
      <AppRouter
        currentPage={currentPage}
        user={user}
        wails={wails}
        isAuthenticated={isAuthenticated}
        servicesInitialized={servicesInitialized}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        notifications={notifications}
        onRemoveNotification={removeNotification}
        onClearAllNotifications={clearAllNotifications}
      />
    </WailsProvider>
  )
}

export default App
