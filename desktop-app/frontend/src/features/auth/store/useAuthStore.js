import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useNavigationStore } from '../../../shared/store/useNavigationStore'

const useAuthStore = create(
  subscribeWithSelector((set, get) => ({
    // Authentication state
    isAuthenticated: false,
    isLoading: false,
    user: null,
    session: null,

    // Setup state
    setupRequired: false,
    isSetupComplete: false,

    // UI state
    error: null,
    errorDetails: null,
    notification: null,

    // Session timeout tracking
    lastActivity: null,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
    sessionCheckInterval: null,

    // Actions
    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error, details = null) => set({ error, errorDetails: details }),

    clearError: () => set({ error: null, errorDetails: null }),

    setSetupRequired: (required) => set({ setupRequired: required }),

    // Set authentication state (used for testing and internal state management)
    setAuthenticated: (isAuth, user = null, session = null) => set({
      isAuthenticated: isAuth,
      user: isAuth ? user : null,
      session: isAuth ? session : null,
      lastActivity: isAuth ? Date.now() : null
    }),

    // Login action - Uses UserService
    login: async (userService, username, password, deviceID = null) => {
      set({ isLoading: true, error: null })

      try {
        console.log('🔐 [useAuthStore] Starting login for:', username)
        console.log('🔐 [useAuthStore] DeviceID:', deviceID)
        console.log('🔐 [useAuthStore] UserService available:', !!userService)

        if (!userService) {
          throw new Error('UserService not available')
        }

        // Generate deviceID if not provided
        const finalDeviceID = deviceID || 'device-' + Math.random().toString(36).substr(2, 9)
        console.log('🔐 [useAuthStore] Final deviceID:', finalDeviceID)

        // Call UserService login
        const parsedResult = await userService.login(username, password)


        console.log('🔐 [useAuthStore] Final parsed result:', parsedResult)
        console.log('🔐 [useAuthStore] Success property:', parsedResult?.success)

        if (parsedResult && parsedResult.success) {
          console.log('✅ [useAuthStore] Login successful! Setting auth state...')
          console.log('🔍 [DEBUG] User data:', parsedResult.data?.user)
          console.log('🔍 [DEBUG] Session data:', parsedResult.data?.session)
          console.log('🔍 [DEBUG] Backend services should now be initialized for role:', parsedResult.data?.user?.role)

          // Normalize role to uppercase for consistency
          const normalizedUser = parsedResult.data?.user ? {
            ...parsedResult.data.user,
            role: parsedResult.data.user.role?.toUpperCase()
          } : null

          set({
            isAuthenticated: true,
            user: normalizedUser,
            session: parsedResult.data?.session,
            lastActivity: Date.now(),
            error: null
          })

          // Note: Backend services are initialized during the login process in Go
          // The frontend should now be able to use all authenticated services
          console.log('✅ [useAuthStore] Backend services initialized successfully')

          // Start session monitoring
          if (get().startSessionMonitoring) {
            get().startSessionMonitoring()
          }

          // Reset navigation to dashboard on successful login
          useNavigationStore.getState().resetNavigation()

          console.log('✅ [useAuthStore] Auth state set successfully')
          return true  // Return boolean for consistency with LoginPage expectations
        } else {
          console.log('❌ [useAuthStore] Login failed, parsedResult.success:', parsedResult?.success)
          console.log('🔍 [DEBUG] Error structure:', parsedResult?.error)

          // Extract detailed error information from backend response
          let errorMessage = 'Login failed'
          let errorDetails = null

          if (parsedResult?.error) {
            // Handle structured error response
            const errorCode = parsedResult.error.code
            errorMessage = parsedResult.error.message || errorMessage

            // Provide user-friendly error messages based on error codes
            switch (errorCode) {
              case 'USER_NOT_FOUND':
                errorMessage = 'Username not found. Please check your username and try again.'
                break
              case 'INVALID_CREDENTIALS':
                errorMessage = 'Invalid password. Please check your password and try again.'
                break
              case 'USER_INACTIVE':
                errorMessage = 'Your account has been deactivated. Please contact your administrator.'
                break
              case 'ACCOUNT_LOCKED':
                errorMessage = 'Your account has been locked. Please contact your administrator.'
                break
              case 'VALIDATION_ERROR':
                errorMessage = 'Invalid input. Please check your username and password.'
                break
              default:
                errorMessage = parsedResult.error.message || errorMessage
            }

            // Store the entire error object as errorDetails for UI display
            errorDetails = parsedResult.error
          } else if (parsedResult?.message) {
            // Handle simple error message
            errorMessage = parsedResult.message
          }

          console.log('❌ [useAuthStore] Final error message:', errorMessage)
          if (errorDetails) {
            console.log('❌ [useAuthStore] Error details:', errorDetails)
          }

          // Store error details for UI display
          set({
            error: errorMessage,
            errorDetails: errorDetails
          })

          // Create enhanced error with details
          const enhancedError = new Error(errorMessage)
          enhancedError.errorDetails = errorDetails
          throw enhancedError
        }
      } catch (error) {
        console.error('❌ [useAuthStore] Login error caught:', error)
        // Use errorDetails from enhanced error if available
        const errorDetails = error.errorDetails || get().errorDetails || null

        set({
          isAuthenticated: false,
          user: null,
          session: null,
          error: error.message || 'Login failed',
          errorDetails: errorDetails
        })
        throw error
      } finally {
        set({ isLoading: false })
      }
    },

    // Logout action - Uses UserService
    logout: async (userService) => {
      set({ isLoading: true })

      try {
        if (userService) {
          // Get current session before clearing state
          const currentSession = get().session
          if (currentSession) {
            // Pass session to backend for proper cleanup
            await userService.logout(currentSession)
          }
        }

        set({
          isAuthenticated: false,
          user: null,
          session: null,
          lastActivity: null,
          error: null
        })

        get().stopSessionMonitoring()

        // Reset navigation on logout
        useNavigationStore.getState().resetNavigation()
      } catch (error) {
        console.error('Logout error:', error)
        // Still clear local state even if logout API fails
        set({
          isAuthenticated: false,
          user: null,
          session: null,
          lastActivity: null
        })
        get().stopSessionMonitoring()
        useNavigationStore.getState().resetNavigation()
      } finally {
        set({ isLoading: false })
      }
    },

    // Check session - Uses UserService with improved error handling
    checkSession: async (userService) => {
      set({ isLoading: true })

      try {
        if (!userService) {
          console.warn('UserService not available for session check')
          set({ isAuthenticated: false, user: null, session: null })
          return null
        }

        // Check if GetCurrentUser method exists in wails bindings
        if (!userService.wails || !userService.wails.GetCurrentUser) {
          console.warn('GetCurrentUser method not available in Wails bindings')
          console.warn('This may happen during app startup or when backend services are not ready')
          // Don't treat missing method as authentication failure
          // Just return null without clearing auth state
          return null
        }

        const parsedResult = await userService.getCurrentUser()

        if (parsedResult && parsedResult.success) {
          console.log('🔍 [DEBUG] Check session user data:', parsedResult.data?.user)
          console.log('🔍 [DEBUG] Check session session data:', parsedResult.data?.session)

          // Normalize role to uppercase for consistency
          const normalizedUser = parsedResult.data?.user ? {
            ...parsedResult.data.user,
            role: parsedResult.data.user.role?.toUpperCase()
          } : null

          set({
            isAuthenticated: true,
            user: normalizedUser,
            session: parsedResult.data?.session,
            lastActivity: Date.now()
          })

          // Start session monitoring
          if (get().startSessionMonitoring) {
            get().startSessionMonitoring()
          }

          return parsedResult.data
        } else {
          // Check if this is a "SESSION_NOT_FOUND" error (expected during core services mode)
          if (parsedResult?.error?.code === 'SESSION_NOT_FOUND') {
            console.log('Session check returned SESSION_NOT_FOUND - this is normal in core services mode')
            // Don't clear existing auth state for this specific case
            return null
          }

          set({
            isAuthenticated: false,
            user: null,
            session: null,
            lastActivity: null
          })

          get().stopSessionMonitoring()

          // Reset navigation if session check fails (user not logged in)
          useNavigationStore.getState().resetNavigation()

          return null
        }
      } catch (error) {
        console.error('Session check error:', error)

        // Check for specific error types
        if (error.message && error.message.includes('GetCurrentUser')) {
          console.warn('GetCurrentUser method missing - this is expected during development or startup')
          // Don't treat missing method as authentication failure
          return null
        }

        // Don't set error for background session checks
        // Session check is a background operation, not a user action
        set({
          isAuthenticated: false,
          user: null,
          session: null,
          lastActivity: null
        })
        get().stopSessionMonitoring()
        useNavigationStore.getState().resetNavigation()
        return null
      } finally {
        set({ isLoading: false })
      }
    },

    // Refresh session - Database Only
    refreshSession: async (refreshFunc) => {
      try {
        if (!refreshFunc) {
          console.warn('Database connection not available for session refresh')
          return null
        }

        const result = await refreshFunc()

        // Parse result if it's a string
        let parsedResult = result
        if (typeof result === 'string') {
          try {
            parsedResult = JSON.parse(result)
          } catch (parseError) {
            console.error('❌ [useAuthStore] Refresh session JSON parse error:', parseError)
            get().logout()
            return null
          }
        }

        if (parsedResult && parsedResult.success) {
          console.log('🔍 [DEBUG] Refresh session user data:', parsedResult.data?.user)
          console.log('🔍 [DEBUG] Refresh session session data:', parsedResult.data?.session)

          // Normalize role to uppercase for consistency
          const normalizedUser = parsedResult.data?.user ? {
            ...parsedResult.data.user,
            role: parsedResult.data.user.role?.toUpperCase()
          } : null

          set({
            isAuthenticated: true,
            user: normalizedUser,
            session: parsedResult.data?.session,
            lastActivity: Date.now()
          })

          return parsedResult.data
        } else {
          // Session refresh failed, logout
          get().logout()
          return null
        }
      } catch (error) {
        console.error('Session refresh error:', error)
        get().logout()
        return null
      }
    },

    // Check if setup is required - Database Only
    checkSetupRequired: async (checkSetupFunc) => {
      try {
        if (!checkSetupFunc) {
          console.warn('Database connection not available for setup check')
          // When no database connection, assume setup is complete
          set({ setupRequired: false, isSetupComplete: true })
          return false
        }

        const result = await checkSetupFunc()
        const setupRequired = result?.setupRequired !== false

        set({ setupRequired, isSetupComplete: !setupRequired })
        return setupRequired
      } catch (error) {
        console.error('Setup check error:', error)
        set({ setupRequired: false, isSetupComplete: true })
        return false
      }
    },

    // Session monitoring
    startSessionMonitoring: () => {
      const state = get()

      // Clear any existing interval
      if (state.sessionCheckInterval) {
        clearInterval(state.sessionCheckInterval)
      }

      const interval = setInterval(() => {
        const currentState = get()

        if (!currentState.isAuthenticated || !currentState.lastActivity) {
          clearInterval(interval)
          return
        }

        const now = Date.now()
        const timeSinceLastActivity = now - currentState.lastActivity

        if (timeSinceLastActivity > currentState.sessionTimeout) {
          console.log('Session expired due to inactivity')
          currentState.logout()
        }
      }, 60000) // Check every minute

      set({ sessionCheckInterval: interval })
    },

    stopSessionMonitoring: () => {
      const state = get()

      if (state.sessionCheckInterval) {
        clearInterval(state.sessionCheckInterval)
        set({ sessionCheckInterval: null })
      }
    },

    // Update last activity
    updateActivity: () => {
      set({ lastActivity: Date.now() })
    },

    // Update last activity (alias for LockScreen compatibility)
    updateLastActivity: () => {
      set({ lastActivity: Date.now() })
    },

    // Force logout without backend call
    forceLogout: () => {
      set({
        isAuthenticated: false,
        user: null,
        session: null,
        lastActivity: null,
        error: null,
        isLoading: false
      })
      get().stopSessionMonitoring()
      useNavigationStore.getState().resetNavigation()
    },

    // Clear notification
    clearNotification: () => {
      set({ notification: null })
    }
  }))
)

// No localStorage persistence for database-only mode
// Sessions are managed entirely through the backend database

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: Auth store reloaded')
  })
}

export default useAuthStore