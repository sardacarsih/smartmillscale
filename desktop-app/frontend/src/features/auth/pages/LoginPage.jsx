import { useState, useEffect } from 'react'
import { Eye, EyeOff, AlertCircle, Lock, User } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { useNotificationStore } from '../../../shared'
import { UserService } from '../../../shared/services/UserService'

const LoginPage = ({ onLoginSuccess, wails }) => {
  // Use wails prop directly instead of context hook to avoid initialization race condition
  const userService = wails ? new UserService(wails) : null

  const {
    login,
    isLoading,
    error,
    clearError
  } = useAuthStore()

  const { notification, clearNotification, showSuccess } = useNotificationStore()

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (error) {
      clearError()
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username.trim() || !formData.password) {
      return
    }

    if (!userService) {
      console.error('❌ [LoginPage] UserService not available')
      return
    }

    // Generate device ID for this login attempt
    const deviceID = 'device-' + Math.random().toString(36).substr(2, 9)

    console.log('🔐 [LoginPage] Starting login attempt for user:', formData.username)
    console.log('🔐 [LoginPage] Generated deviceID:', deviceID)
    console.log('🔐 [LoginPage] Wails Login function available:', !!wails?.Login)

    try {
      // Call UserService through auth store
      const success = await login(userService, formData.username, formData.password, deviceID)

      console.log('🔐 [LoginPage] Login result:', success)
      console.log('🔐 [LoginPage] Auth store state after login:', {
        isAuthenticated: useAuthStore.getState().isAuthenticated,
        user: useAuthStore.getState().user,
        error: useAuthStore.getState().error
      })

      if (success) {
        console.log('✅ [LoginPage] Login successful! Showing success message...')
        showSuccess(`Selamat datang kembali, ${formData.username}!`)
        if (onLoginSuccess) {
          onLoginSuccess()
        }
      } else {
        console.log('❌ [LoginPage] Login returned false, but no error was thrown')
      }
    } catch (error) {
      console.error('❌ [LoginPage] Login error caught:', error)
      console.log('🔐 [LoginPage] Auth store error state:', useAuthStore.getState().error)
    }
  }

  // Handle Enter key in form fields
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Clear notification on unmount
  useEffect(() => {
    return () => {
      clearNotification()
    }
  }, [clearNotification])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
      </div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Smart Mill Scale
          </h1>
          <p className="text-gray-300">
            Masuk ke sistem penimbangan
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">Login Gagal</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {notification && notification.type === 'success' && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-400 text-sm font-medium">{notification.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Masukkan username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Masukkan password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 focus:outline-none transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.username.trim() || !formData.password || !userService}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Masuk...</span>
                </div>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">
                Hubungi administrator untuk mendapatkan akses
              </p>
              <p className="text-gray-500 text-xs">
                Smart Mill Scale v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage