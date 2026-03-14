import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import LoginPage from './LoginPage'
import useAuthStore from '../store/useAuthStore'
import { useNotificationStore } from '../../../shared'

const h = React.createElement

vi.mock('../store/useAuthStore')
vi.mock('../../../shared', () => ({
  useNotificationStore: vi.fn()
}))
vi.mock('lucide-react', () => ({
  Eye: () => h('div', null, 'Eye Icon'),
  EyeOff: () => h('div', null, 'EyeOff Icon'),
  AlertCircle: () => h('div', null, 'Alert Icon'),
  Lock: () => h('div', null, 'Lock Icon'),
  User: () => h('div', null, 'User Icon')
}))

describe('LoginPage', () => {
  let mockLogin
  let mockClearError
  let mockShowSuccess
  let mockClearNotification
  let mockWails
  let authStoreState

  const setAuthStoreMock = (overrides = {}) => {
    authStoreState = {
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      ...overrides
    }

    useAuthStore.mockReturnValue(authStoreState)
    useAuthStore.getState = vi.fn(() => ({
      isAuthenticated: false,
      user: null,
      error: authStoreState.error,
      ...overrides.getState,
    }))
  }

  beforeEach(() => {
    mockLogin = vi.fn()
    mockClearError = vi.fn()
    mockShowSuccess = vi.fn()
    mockClearNotification = vi.fn()
    mockWails = {
      Login: vi.fn()
    }

    setAuthStoreMock()

    useNotificationStore.mockReturnValue({
      notification: null,
      clearNotification: mockClearNotification,
      showSuccess: mockShowSuccess
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering Komponen', () => {
    it('harus render form login dengan semua elemen', () => {
      render(h(LoginPage, { wails: mockWails }))

      expect(screen.getByText('Smart Mill Scale')).toBeInTheDocument()
      expect(screen.getByText('Masuk ke sistem penimbangan')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument()
    })

    it('harus menampilkan placeholder yang benar', () => {
      render(h(LoginPage, { wails: mockWails }))

      expect(screen.getByPlaceholderText('Masukkan username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Masukkan password')).toBeInTheDocument()
    })

    it('harus render informasi footer', () => {
      render(h(LoginPage, { wails: mockWails }))

      expect(screen.getByText('Hubungi administrator untuk mendapatkan akses')).toBeInTheDocument()
      expect(screen.getByText('Smart Mill Scale v1.0.0')).toBeInTheDocument()
    })
  })

  describe('Input Handling', () => {
    it('harus mengupdate nilai username saat user mengetik', async () => {
      const user = userEvent.setup()
      render(h(LoginPage, { wails: mockWails }))

      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'admin')

      expect(usernameInput).toHaveValue('admin')
    })

    it('harus mengupdate nilai password saat user mengetik', async () => {
      const user = userEvent.setup()
      render(h(LoginPage, { wails: mockWails }))

      const passwordInput = screen.getByLabelText('Password')
      await user.type(passwordInput, 'password123')

      expect(passwordInput).toHaveValue('password123')
    })

    it('harus clear error saat user mulai mengetik', async () => {
      const user = userEvent.setup()
      setAuthStoreMock({
        error: 'Login failed'
      })

      render(h(LoginPage, { wails: mockWails }))

      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'a')

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('harus menampilkan password sebagai hidden by default', () => {
      render(h(LoginPage, { wails: mockWails }))

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('harus toggle password visibility saat tombol diklik', async () => {
      const user = userEvent.setup()
      render(h(LoginPage, { wails: mockWails }))

      const passwordInput = screen.getByLabelText('Password')
      const toggleButton = passwordInput.parentElement.querySelector('button')

      expect(passwordInput).toHaveAttribute('type', 'password')

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Validation', () => {
    it('harus disable submit button jika username kosong', () => {
      render(h(LoginPage, { wails: mockWails }))

      const submitButton = screen.getByRole('button', { name: /masuk/i })
      expect(submitButton).toBeDisabled()
    })

    it('harus disable submit button jika password kosong', async () => {
      const user = userEvent.setup()
      render(h(LoginPage, { wails: mockWails }))

      const usernameInput = screen.getByLabelText('Username')
      await user.type(usernameInput, 'admin')

      const submitButton = screen.getByRole('button', { name: /masuk/i })
      expect(submitButton).toBeDisabled()
    })

    it('harus enable submit button jika kedua field terisi', async () => {
      const user = userEvent.setup()
      render(h(LoginPage, { wails: mockWails }))

      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')

      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /masuk/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('harus disable submit button jika username hanya spasi', async () => {
      const user = userEvent.setup()
      render(h(LoginPage, { wails: mockWails }))

      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')

      await user.type(usernameInput, '   ')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /masuk/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Login Submission', () => {
    it('harus memanggil login function dengan kredensial yang benar', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue(true)
      setAuthStoreMock({
        getState: {
          isAuthenticated: true,
          user: { username: 'admin' },
          error: null
        }
      })

      render(h(LoginPage, { wails: mockWails }))

      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /masuk/i })

      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
        const callArgs = mockLogin.mock.calls[0]
        expect(callArgs[1]).toBe('admin')
        expect(callArgs[2]).toBe('password123')
        expect(callArgs[3]).toMatch(/^device-/)
      })
    })

    it('harus menampilkan success notification setelah login berhasil', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue(true)
      setAuthStoreMock({
        getState: {
          isAuthenticated: true,
          user: { username: 'admin' },
          error: null
        }
      })

      render(h(LoginPage, { wails: mockWails }))

      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /masuk/i })

      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Selamat datang kembali, admin!')
      })
    })

    it('harus memanggil onLoginSuccess callback jika disediakan', async () => {
      const user = userEvent.setup()
      const mockOnLoginSuccess = vi.fn()
      mockLogin.mockResolvedValue(true)
      setAuthStoreMock({
        getState: {
          isAuthenticated: true,
          user: { username: 'admin' },
          error: null
        }
      })

      render(h(LoginPage, { wails: mockWails, onLoginSuccess: mockOnLoginSuccess }))

      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /masuk/i })

      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled()
      })
    })

    it('harus support Enter key untuk submit form', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue(true)
      setAuthStoreMock({
        getState: {
          isAuthenticated: true,
          user: { username: 'admin' },
          error: null
        }
      })

      render(h(LoginPage, { wails: mockWails }))

      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')

      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'password123{Enter}')

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })
    })
  })

  describe('Loading State', () => {
    it('harus menampilkan loading state saat login sedang diproses', () => {
      setAuthStoreMock({
        isLoading: true
      })

      render(h(LoginPage, { wails: mockWails }))

      expect(screen.getByText('Masuk...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /masuk/i })).toBeDisabled()
    })

    it('harus disable input fields saat loading', () => {
      setAuthStoreMock({
        isLoading: true
      })

      render(h(LoginPage, { wails: mockWails }))

      expect(screen.getByLabelText('Username')).toBeDisabled()
      expect(screen.getByLabelText('Password')).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('harus menampilkan error message jika login gagal', () => {
      setAuthStoreMock({
        error: 'Username atau password salah'
      })

      render(h(LoginPage, { wails: mockWails }))

      expect(screen.getByText('Login Gagal')).toBeInTheDocument()
      expect(screen.getByText('Username atau password salah')).toBeInTheDocument()
    })

    it('harus menampilkan error untuk kredensial invalid', () => {
      setAuthStoreMock({
        error: 'Invalid password. Please check your password and try again.'
      })

      render(h(LoginPage, { wails: mockWails }))

      expect(screen.getByText('Invalid password. Please check your password and try again.')).toBeInTheDocument()
    })
  })

  describe('Success Notification', () => {
    it('harus menampilkan success notification jika ada', () => {
      useNotificationStore.mockReturnValue({
        notification: {
          type: 'success',
          message: 'Login berhasil!'
        },
        clearNotification: mockClearNotification,
        showSuccess: mockShowSuccess
      })

      render(h(LoginPage, { wails: mockWails }))

      expect(screen.getByText('Login berhasil!')).toBeInTheDocument()
    })

    it('harus clear notification saat component unmount', () => {
      const { unmount } = render(h(LoginPage, { wails: mockWails }))

      unmount()

      expect(mockClearNotification).toHaveBeenCalled()
    })
  })
})
