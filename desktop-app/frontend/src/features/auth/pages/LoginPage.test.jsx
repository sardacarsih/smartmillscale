import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'
import useAuthStore from '../store/useAuthStore'
import { useNotificationStore } from '../../../shared'

// Mock the stores
vi.mock('../store/useAuthStore')
vi.mock('../../../shared', () => ({
    useNotificationStore: vi.fn()
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Eye: () => <div>Eye Icon</div>,
    EyeOff: () => <div>EyeOff Icon</div>,
    AlertCircle: () => <div>Alert Icon</div>,
    Lock: () => <div>Lock Icon</div>,
    User: () => <div>User Icon</div>
}))

describe('LoginPage', () => {
    let mockLogin
    let mockClearError
    let mockShowSuccess
    let mockClearNotification
    let mockWails

    beforeEach(() => {
        // Setup mocks
        mockLogin = vi.fn()
        mockClearError = vi.fn()
        mockShowSuccess = vi.fn()
        mockClearNotification = vi.fn()

        // Mock Wails object with Login method
        mockWails = {
            Login: vi.fn()
        }

        // Mock useAuthStore
        useAuthStore.mockReturnValue({
            login: mockLogin,
            isLoading: false,
            error: null,
            clearError: mockClearError
        })

        // Mock useNotificationStore
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
            const mockWails = {
                Login: vi.fn()
            }
            render(<LoginPage wails={mockWails} />)

            // Check title
            expect(screen.getByText('Smart Mill Scale')).toBeInTheDocument()
            expect(screen.getByText('Masuk ke sistem penimbangan')).toBeInTheDocument()

            // Check form fields
            expect(screen.getByLabelText('Username')).toBeInTheDocument()
            expect(screen.getByLabelText('Password')).toBeInTheDocument()

            // Check submit button
            expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument()
        })

        it('harus menampilkan placeholder yang benar', () => {
            render(<LoginPage wails={mockWails} />)

            expect(screen.getByPlaceholderText('Masukkan username')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('Masukkan password')).toBeInTheDocument()
        })

        it('harus render informasi footer', () => {
            render(<LoginPage wails={mockWails} />)

            expect(screen.getByText('Hubungi administrator untuk mendapatkan akses')).toBeInTheDocument()
            expect(screen.getByText('Smart Mill Scale v1.0.0')).toBeInTheDocument()
        })
    })

    describe('Input Handling', () => {
        it('harus mengupdate nilai username saat user mengetik', async () => {
            const user = userEvent.setup()
            render(<LoginPage wails={mockWails} />)

            const usernameInput = screen.getByLabelText('Username')
            await user.type(usernameInput, 'admin')

            expect(usernameInput).toHaveValue('admin')
        })

        it('harus mengupdate nilai password saat user mengetik', async () => {
            const user = userEvent.setup()
            render(<LoginPage wails={mockWails} />)

            const passwordInput = screen.getByLabelText('Password')
            await user.type(passwordInput, 'password123')

            expect(passwordInput).toHaveValue('password123')
        })

        it('harus clear error saat user mulai mengetik', async () => {
            const user = userEvent.setup()
            useAuthStore.mockReturnValue({
                login: mockLogin,
                isLoading: false,
                error: 'Login failed',
                clearError: mockClearError
            })

            render(<LoginPage wails={mockWails} />)

            const usernameInput = screen.getByLabelText('Username')
            await user.type(usernameInput, 'a')

            expect(mockClearError).toHaveBeenCalled()
        })
    })

    describe('Password Visibility Toggle', () => {
        it('harus menampilkan password sebagai hidden by default', () => {
            render(<LoginPage wails={mockWails} />)

            const passwordInput = screen.getByLabelText('Password')
            expect(passwordInput).toHaveAttribute('type', 'password')
        })

        it('harus toggle password visibility saat tombol diklik', async () => {
            const user = userEvent.setup()
            render(<LoginPage wails={mockWails} />)

            const passwordInput = screen.getByLabelText('Password')
            const toggleButton = passwordInput.parentElement.querySelector('button')

            // Initially hidden
            expect(passwordInput).toHaveAttribute('type', 'password')

            // Click to show
            await user.click(toggleButton)
            expect(passwordInput).toHaveAttribute('type', 'text')

            // Click to hide again
            await user.click(toggleButton)
            expect(passwordInput).toHaveAttribute('type', 'password')
        })
    })

    describe('Form Validation', () => {
        it('harus disable submit button jika username kosong', () => {
            render(<LoginPage wails={mockWails} />)

            const submitButton = screen.getByRole('button', { name: /masuk/i })
            expect(submitButton).toBeDisabled()
        })

        it('harus disable submit button jika password kosong', async () => {
            const user = userEvent.setup()
            render(<LoginPage wails={mockWails} />)

            const usernameInput = screen.getByLabelText('Username')
            await user.type(usernameInput, 'admin')

            const submitButton = screen.getByRole('button', { name: /masuk/i })
            expect(submitButton).toBeDisabled()
        })

        it('harus enable submit button jika kedua field terisi', async () => {
            const user = userEvent.setup()
            render(<LoginPage wails={mockWails} />)

            const usernameInput = screen.getByLabelText('Username')
            const passwordInput = screen.getByLabelText('Password')

            await user.type(usernameInput, 'admin')
            await user.type(passwordInput, 'password123')

            const submitButton = screen.getByRole('button', { name: /masuk/i })
            expect(submitButton).not.toBeDisabled()
        })

        it('harus disable submit button jika username hanya spasi', async () => {
            const user = userEvent.setup()
            render(<LoginPage wails={mockWails} />)

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

            render(<LoginPage wails={mockWails} />)

            const usernameInput = screen.getByLabelText('Username')
            const passwordInput = screen.getByLabelText('Password')
            const submitButton = screen.getByRole('button', { name: /masuk/i })

            await user.type(usernameInput, 'admin')
            await user.type(passwordInput, 'password123')
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalled()
                // Check that login was called with userService, username, password, and deviceID
                const callArgs = mockLogin.mock.calls[0]
                expect(callArgs[1]).toBe('admin') // username
                expect(callArgs[2]).toBe('password123') // password
                expect(callArgs[3]).toMatch(/^device-/) // deviceID pattern
            })
        })

        it('harus menampilkan success notification setelah login berhasil', async () => {
            const user = userEvent.setup()
            mockLogin.mockResolvedValue(true)

            render(<LoginPage wails={mockWails} />)

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

            render(<LoginPage wails={mockWails} onLoginSuccess={mockOnLoginSuccess} />)

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

            render(<LoginPage wails={mockWails} />)

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
            useAuthStore.mockReturnValue({
                login: mockLogin,
                isLoading: true,
                error: null,
                clearError: mockClearError
            })

            render(<LoginPage wails={mockWails} />)

            expect(screen.getByText('Masuk...')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /masuk/i })).toBeDisabled()
        })

        it('harus disable input fields saat loading', () => {
            useAuthStore.mockReturnValue({
                login: mockLogin,
                isLoading: true,
                error: null,
                clearError: mockClearError
            })

            render(<LoginPage wails={mockWails} />)

            expect(screen.getByLabelText('Username')).toBeDisabled()
            expect(screen.getByLabelText('Password')).toBeDisabled()
        })
    })

    describe('Error Handling', () => {
        it('harus menampilkan error message jika login gagal', () => {
            useAuthStore.mockReturnValue({
                login: mockLogin,
                isLoading: false,
                error: 'Username atau password salah',
                clearError: mockClearError
            })

            render(<LoginPage wails={mockWails} />)

            expect(screen.getByText('Login Gagal')).toBeInTheDocument()
            expect(screen.getByText('Username atau password salah')).toBeInTheDocument()
        })

        it('harus menampilkan error untuk kredensial invalid', () => {
            useAuthStore.mockReturnValue({
                login: mockLogin,
                isLoading: false,
                error: 'Invalid password. Please check your password and try again.',
                clearError: mockClearError
            })

            render(<LoginPage wails={mockWails} />)

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

            render(<LoginPage wails={mockWails} />)

            expect(screen.getByText('Login berhasil!')).toBeInTheDocument()
        })

        it('harus clear notification saat component unmount', () => {
            const { unmount } = render(<LoginPage wails={mockWails} />)

            unmount()

            expect(mockClearNotification).toHaveBeenCalled()
        })
    })
})

