import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
// Feature imports
import { LoginPage, LockScreen, useAuthStore } from './features/auth'
// Shared imports
import { ErrorBoundary, useNotificationStore } from './shared'
import { useWeightMonitoring } from './shared/hooks'
import useNavigationStore from './shared/store/useNavigationStore'
import useGlobalWeightStore from './shared/store/useGlobalWeightStore'
import { WailsProvider } from './shared/contexts/WailsContext'
import { UserService } from './shared/services/UserService'
import { MasterDataService } from './shared/services/MasterDataService'
import LoadingScreen from './shared/components/LoadingScreen'
import AppRouter from './shared/components/AppRouter'
import useSessionTimeout from './shared/hooks/useSessionTimeout'
// Import Wails wrapper
import { getWailsWrapper } from './shared/lib/wailsWrapper'
import usePKSStore, { clearPKSMasterDataCache } from './features/timbang1/store/usePKSStore'

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
  const masterDataService = useMemo(() => wails ? new MasterDataService(wails) : null, [wails])
  const masterSyncIntervalRef = useRef(null)
  const hasTriggeredMasterSyncRef = useRef(false)

  const refreshMasterDataAfterSync = useCallback(async () => {
    clearPKSMasterDataCache()

    if (!masterDataService) {
      return
    }

    try {
      const pksStore = usePKSStore.getState()
      if (typeof pksStore.fetchMasterDataWithCache === 'function') {
        await pksStore.fetchMasterDataWithCache(masterDataService, true)
      }
    } catch (error) {
      console.warn('Failed to refresh PKS master data after sync:', error?.message || error)
    }
  }, [masterDataService])

  const triggerMasterDataSync = useCallback(async (triggerSource = 'auto') => {
    if (!masterDataService) {
      return null
    }

    try {
      const result = await masterDataService.triggerMasterDataSync({
        triggerSource,
        scope: ['estate', 'afdeling', 'blok']
      })

      if (result?.success) {
        await refreshMasterDataAfterSync()
        window.dispatchEvent(new CustomEvent('master-data:sync-success', { detail: result }))
      }

      return result
    } catch (error) {
      console.warn('Master data auto-sync failed:', error?.message || error)
      return null
    }
  }, [masterDataService, refreshMasterDataAfterSync])

  const getMasterSyncIntervalMs = useCallback(async () => {
    const fallback = 5 * 60 * 1000

    try {
      if (!wails || typeof wails.GetSystemSettings !== 'function') {
        return fallback
      }

      const settingsJSON = await wails.GetSystemSettings()
      const parsed = JSON.parse(settingsJSON)
      const minutes = Number(parsed?.system?.syncInterval)

      if (Number.isFinite(minutes) && minutes > 0) {
        return Math.floor(minutes * 60 * 1000)
      }
    } catch (error) {
      console.warn('Failed to resolve master sync interval from settings, using fallback 5 minutes')
    }

    return fallback
  }, [wails])

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

  useEffect(() => {
    const shouldRunMasterSync = Boolean(isAuthenticated && servicesInitialized && wails && masterDataService)

    if (!shouldRunMasterSync) {
      hasTriggeredMasterSyncRef.current = false
      if (masterSyncIntervalRef.current) {
        clearInterval(masterSyncIntervalRef.current)
        masterSyncIntervalRef.current = null
      }
      return
    }

    let isCancelled = false

    const setupMasterSyncLoop = async () => {
      if (!hasTriggeredMasterSyncRef.current) {
        hasTriggeredMasterSyncRef.current = true
        await triggerMasterDataSync('auto')
      }

      const intervalMs = await getMasterSyncIntervalMs()
      if (isCancelled) {
        return
      }

      if (masterSyncIntervalRef.current) {
        clearInterval(masterSyncIntervalRef.current)
      }

      masterSyncIntervalRef.current = setInterval(() => {
        triggerMasterDataSync('auto')
      }, intervalMs)
    }

    setupMasterSyncLoop()

    return () => {
      isCancelled = true
      if (masterSyncIntervalRef.current) {
        clearInterval(masterSyncIntervalRef.current)
        masterSyncIntervalRef.current = null
      }
    }
  }, [isAuthenticated, servicesInitialized, wails, masterDataService, triggerMasterDataSync, getMasterSyncIntervalMs])

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

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') {
      return undefined
    }

    window.__SMART_MILL_TEST_HOOKS__ = {
      isServicesInitialized: () => servicesInitialized,
      setAuthenticatedUser: ({ user: nextUser, session: nextSession, page = 'dashboard' }) => {
        useAuthStore.getState().setAuthenticated(true, nextUser, nextSession)
        useNavigationStore.getState().resetNavigation()
        if (page && page !== 'dashboard') {
          useNavigationStore.getState().navigateTo(page)
        }
      },
      logout: () => {
        useAuthStore.getState().forceLogout()
      },
      navigateTo: (page) => {
        if (page) {
          useNavigationStore.getState().navigateTo(page)
        }
      }
    }

    return () => {
      delete window.__SMART_MILL_TEST_HOOKS__
    }
  }, [servicesInitialized])

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

