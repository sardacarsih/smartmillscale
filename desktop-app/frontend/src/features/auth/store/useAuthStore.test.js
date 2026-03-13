import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { create } from 'zustand'

// Mock the Wails API
const mockLoginFunc = vi.fn()
const mockLogoutFunc = vi.fn()
const mockCheckSessionFunc = vi.fn()
const mockRefreshSessionFunc = vi.fn()
const mockCheckSetupFunc = vi.fn()

// Import the store
import useAuthStore from './useAuthStore.js'

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error
const originalConsoleLog = console.log

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = vi.fn()
    console.log = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    console.error = originalConsoleError
    console.log = originalConsoleLog
  })

  describe('State Awal', () => {
    it('harus memiliki state awal yang benar', () => {
      const store = useAuthStore.getState()

      expect(store.isAuthenticated).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.user).toBe(null)
      expect(store.session).toBe(null)
      expect(store.setupRequired).toBe(false)
      expect(store.isSetupComplete).toBe(false)
      expect(store.error).toBe(null)
      expect(store.errorDetails).toBe(null)
      expect(store.notification).toBe(null)
      expect(store.lastActivity).toBe(null)
      expect(store.sessionCheckInterval).toBe(null)
    })
  })

  describe('Fungsi Login', () => {
    let store

    beforeEach(() => {
      // Reset store state properly
      useAuthStore.getState().forceLogout() // Clear all auth state
      useAuthStore.getState().clearError() // Clear any errors
      useAuthStore.getState().setLoading(false) // Reset loading state
      store = useAuthStore.getState()
    })

    it('harus berhasil login dengan kredensial yang valid', async () => {
      // Mock successful login response
      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'user-123',
            username: 'admin',
            full_name: 'Administrator',
            role: 'ADMIN',
            is_active: true
          },
          session: {
            user_id: 'user-123',
            username: 'admin',
            role: 'ADMIN',
            device_id: 'device-001',
            login_time: '2025-11-18T10:00:00Z',
            expires_at: '2025-11-18T18:00:00Z'
          }
        }
      }

      mockLoginFunc.mockResolvedValue(mockResponse)

      // Attempt login
      const result = await store.login(mockLoginFunc, 'admin', 'admin123')

      // Get fresh state after login
      const freshState = useAuthStore.getState()

      // Verify successful login
      expect(result).toBe(true)
      expect(freshState.isAuthenticated).toBe(true)
      expect(freshState.user).toEqual(mockResponse.data.user)
      expect(freshState.session).toEqual(mockResponse.data.session)
      expect(freshState.error).toBe(null)
      expect(freshState.isLoading).toBe(false)
      expect(freshState.lastActivity).toBeDefined()
    })

    it('harus menangani respons JSON string dari backend', async () => {
      // Mock backend returning JSON string
      const mockResponseString = JSON.stringify({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'user-123',
            username: 'admin',
            role: 'ADMIN',
            full_name: 'Administrator',
            is_active: true
          },
          session: {
            user_id: 'user-123',
            device_id: 'device-001'
          }
        }
      })

      mockLoginFunc.mockResolvedValue(mockResponseString)

      // Attempt login
      const result = await store.login(mockLoginFunc, 'admin', 'admin123')

      // Get fresh state after login
      const freshState = useAuthStore.getState()

      // Verify successful login
      expect(result).toBe(true)
      expect(freshState.isAuthenticated).toBe(true)
      expect(freshState.user).toEqual({
        id: 'user-123',
        username: 'admin',
        role: 'ADMIN',
        full_name: 'Administrator',
        is_active: true
      })
    })

    it('harus menangani respons objek dari backend', async () => {
      // Mock backend returning parsed object
      const mockResponseObject = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'user-123',
            username: 'admin',
            role: 'ADMIN',
            full_name: 'Administrator',
            is_active: true
          },
          session: {
            user_id: 'user-123',
            device_id: 'device-001'
          }
        }
      }

      mockLoginFunc.mockResolvedValue(mockResponseObject)

      // Attempt login
      const result = await store.login(mockLoginFunc, 'admin', 'admin123')

      // Get fresh state after login
      const freshState = useAuthStore.getState()

      // Verify successful login
      expect(result).toBe(true)
      expect(freshState.isAuthenticated).toBe(true)
      expect(freshState.user).toEqual({
        id: 'user-123',
        username: 'admin',
        role: 'ADMIN',
        full_name: 'Administrator',
        is_active: true
      })
    })

    it('harus menangani error kredensial tidak valid', async () => {
      // Mock authentication failure
      const mockErrorResponse = {
        success: false,
        message: 'Login failed',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid password. Please check your password and try again.',
          timestamp: '2025-11-18T10:00:00Z'
        }
      }

      mockLoginFunc.mockResolvedValue(mockErrorResponse)

      // Attempt login and expect error
      await expect(store.login(mockLoginFunc, 'admin', 'wrongpassword')).rejects.toThrow('Invalid password. Please check your password and try again.')

      // Get fresh state after failed login
      const freshState = useAuthStore.getState()

      // Verify error state (note: store should remain unauthenticated)
      expect(freshState.isAuthenticated).toBe(false)
      expect(freshState.user).toBeNull()
      expect(freshState.session).toBeNull()
      expect(freshState.error).toBe('Invalid password. Please check your password and try again.')
      expect(freshState.errorDetails).toEqual(mockErrorResponse.error)
      expect(freshState.isLoading).toBe(false)
    })

    it('harus menangani error pengguna tidak ditemukan', async () => {
      // Mock user not found error
      const mockErrorResponse = {
        success: false,
        message: 'Login failed',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Username not found. Please check your username and try again.',
          timestamp: '2025-11-18T10:00:00Z'
        }
      }

      mockLoginFunc.mockResolvedValue(mockErrorResponse)

      // Attempt login and expect error
      await expect(store.login(mockLoginFunc, 'nonexistent', 'password')).rejects.toThrow('Username not found. Please check your username and try again.')

      // Get fresh state after failed login
      const freshState = useAuthStore.getState()

      // Verify error state
      expect(freshState.isAuthenticated).toBe(false)
      expect(freshState.error).toBe('Username not found. Please check your username and try again.')
    })

    it('harus menangani error pengguna tidak aktif', async () => {
      // Mock user inactive error
      const mockErrorResponse = {
        success: false,
        message: 'Login failed',
        error: {
          code: 'USER_INACTIVE',
          message: 'Your account has been deactivated. Please contact your administrator.',
          timestamp: '2025-11-18T10:00:00Z'
        }
      }

      mockLoginFunc.mockResolvedValue(mockErrorResponse)

      // Attempt login and expect error
      await expect(store.login(mockLoginFunc, 'inactive', 'password')).rejects.toThrow('Your account has been deactivated. Please contact your administrator.')
    })

    it('harus menangani format respons tidak valid', async () => {
      // Mock invalid response
      mockLoginFunc.mockRejectedValue(new Error('Invalid response format from server'))

      // Attempt login and expect error
      await expect(store.login(mockLoginFunc, 'admin', 'admin123')).rejects.toThrow('Invalid response format from server')
    })

    it('harus menangani koneksi database tidak tersedia', async () => {
      // Mock no login function available
      await expect(store.login(null, 'admin', 'admin123')).rejects.toThrow('Database connection not available')
    })

    it('harus menangani error parsing JSON', async () => {
      // Mock invalid JSON string
      mockLoginFunc.mockResolvedValue('invalid json string')

      // Attempt login and expect error
      await expect(store.login(mockLoginFunc, 'admin', 'admin123')).rejects.toThrow('Invalid response format from server')
    })
  })

  describe('Fungsi Logout', () => {
    let store

    beforeEach(() => {
      // Reset and set authenticated state
      useAuthStore.getState().forceLogout()
      useAuthStore.getState().clearError()
      store = useAuthStore.getState()
      store.setAuthenticated(true, { id: 'test', username: 'test' }, { id: 'session-test' })
      store.setError('test error')
    })

    it('harus berhasil logout', async () => {
      mockLogoutFunc.mockResolvedValue(undefined)

      await store.logout(mockLogoutFunc)

      // Get fresh state after logout
      const freshState = useAuthStore.getState()

      expect(freshState.isAuthenticated).toBe(false)
      expect(freshState.user).toBeNull()
      expect(freshState.session).toBeNull()
      expect(freshState.error).toBeNull()
      expect(freshState.lastActivity).toBeNull()
      expect(freshState.isLoading).toBe(false)
    })

    it('harus menangani error logout dengan baik', async () => {
      mockLogoutFunc.mockRejectedValue(new Error('Logout failed'))

      await store.logout(mockLogoutFunc)

      // Should still clear local state even if logout fails
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
    })
  })

  describe('Fungsi Cek Sesi', () => {
    let store

    beforeEach(() => {
      useAuthStore.getState().forceLogout()
      useAuthStore.getState().clearError()
      store = useAuthStore.getState()
    })

    it('harus berhasil memeriksa sesi', async () => {
      const mockSessionResponse = {
        success: true,
        message: 'Session is valid',
        data: {
          user: {
            id: 'user-123',
            username: 'admin',
            role: 'ADMIN'
          },
          session: {
            user_id: 'user-123',
            device_id: 'device-001'
          }
        }
      }

      mockCheckSessionFunc.mockResolvedValue(mockSessionResponse)

      const result = await store.checkSession(mockCheckSessionFunc)

      // Get fresh state after session check
      const freshState = useAuthStore.getState()

      expect(result).toBeTruthy()
      expect(freshState.isAuthenticated).toBe(true)
      expect(freshState.user).toEqual(mockSessionResponse.data.user)
      expect(freshState.session).toEqual(mockSessionResponse.data.session)
    })

    it('harus menangani sesi tidak valid', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Session expired',
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired',
          timestamp: '2025-11-18T10:00:00Z'
        }
      }

      mockCheckSessionFunc.mockResolvedValue(mockErrorResponse)

      const result = await store.checkSession(mockCheckSessionFunc)

      expect(result).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
    })

    it('harus menangani koneksi database tidak tersedia', async () => {
      const result = await store.checkSession(null)

      expect(result).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('Penanganan Error', () => {
    let store

    beforeEach(() => {
      useAuthStore.getState().forceLogout()
      useAuthStore.getState().clearError()
      store = useAuthStore.getState()
    })

    it('harus mengatur error dengan detail', () => {
      const errorDetails = { field: 'username', message: 'Username is required' }

      store.setError('Validation failed', errorDetails)

      // Get fresh state after setting error
      const freshState = useAuthStore.getState()

      expect(freshState.error).toBe('Validation failed')
      expect(freshState.errorDetails).toEqual(errorDetails)
    })

    it('harus membersihkan error', () => {
      store.setError('Test error', null)
      let freshState = useAuthStore.getState()
      expect(freshState.error).toBe('Test error')

      store.clearError()
      freshState = useAuthStore.getState()
      expect(freshState.error).toBeNull()
      expect(freshState.errorDetails).toBeNull()
    })
  })

  describe('Manajemen Sesi', () => {
    let store

    beforeEach(() => {
      useAuthStore.getState().forceLogout()
      useAuthStore.getState().clearError()
      store = useAuthStore.getState()
    })

    it('harus memperbarui timestamp aktivitas', () => {
      const mockTime = 1234567890
      const originalDateNow = Date.now

      // Mock Date.now to return consistent value
      const mockDateNow = vi.fn(() => mockTime)
      Date.now = mockDateNow

      store.updateActivity()

      // Get fresh state after updating activity
      const freshState = useAuthStore.getState()

      expect(freshState.lastActivity).toBe(mockTime)

      // Restore original Date.now
      Date.now = originalDateNow
    })

    it('harus memperbarui timestamp aktivitas menggunakan metode alias', () => {
      const mockTime = 9876543210
      const originalDateNow = Date.now

      // Mock Date.now to return consistent value
      const mockDateNow = vi.fn(() => mockTime)
      Date.now = mockDateNow

      store.updateLastActivity()

      // Get fresh state after updating activity
      const freshState = useAuthStore.getState()

      expect(freshState.lastActivity).toBe(mockTime)

      // Restore original Date.now
      Date.now = originalDateNow
    })

    it('harus memaksa logout tanpa panggilan backend', () => {
      store.setAuthenticated(true, { id: 'test' }, { id: 'test-session' })
      store.setError('test error')
      store.setLoading(true)

      store.forceLogout()

      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
      expect(store.error).toBeNull()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('Manajemen Setup', () => {
    let store

    beforeEach(() => {
      useAuthStore.getState().forceLogout()
      useAuthStore.getState().clearError()
      store = useAuthStore.getState()
    })

    it('harus mengatur status setup diperlukan', () => {
      store.setSetupRequired(true)

      // Get fresh state after setting setup required
      const freshState = useAuthStore.getState()

      expect(freshState.setupRequired).toBe(true)
      expect(freshState.isSetupComplete).toBe(false)
    })

    it('harus memeriksa kebutuhan setup', async () => {
      // Mock setup required response
      mockCheckSetupFunc.mockResolvedValue({ setupRequired: true, userCount: 0 })

      const result = await store.checkSetupRequired(mockCheckSetupFunc)

      // Get fresh state after checking setup
      const freshState = useAuthStore.getState()

      expect(result).toBe(true)
      expect(freshState.setupRequired).toBe(true)
      expect(freshState.isSetupComplete).toBe(false)
    })

    it('harus menangani koneksi database tidak tersedia untuk pemeriksaan setup', async () => {
      const result = await store.checkSetupRequired(null)

      // Get fresh state after checking setup
      const freshState = useAuthStore.getState()

      expect(result).toBe(false)
      expect(freshState.setupRequired).toBe(false)
      expect(freshState.isSetupComplete).toBe(true)
    })
  })
})