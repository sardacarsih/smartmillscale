import { useState, useEffect, useRef } from 'react'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'

const LockScreen = ({ onUnlockSuccess, onLogout, userService }) => {
  const {
    user,
    isLoading,
    error,
    notification,
    clearNotification,
    clearError,
    updateLastActivity,
    login
  } = useAuthStore()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLocked, setIsLocked] = useState(true)
  const [lockTime, setLockTime] = useState(new Date())
  const inputRef = useRef(null)

  // Auto-focus password input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])


  // Handle password input changes
  const handlePasswordChange = (e) => {
    setPassword(e.target.value)

    // Clear error when user starts typing
    if (error) {
      clearError()
    }
  }

  // Handle unlock attempt
  const handleUnlock = async (e) => {
    e.preventDefault()

    if (!password.trim()) {
      return
    }

    try {
      // Use auth store login through UserService (consistent with LoginPage)
      await login(userService, user.username, password)

      // If login succeeds, auth store is updated - unlock the screen
      updateLastActivity()
      setIsLocked(false)

      if (onUnlockSuccess) {
        onUnlockSuccess()
      }
    } catch (err) {
      console.error('Unlock failed:', err)
    }
  }

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUnlock(e)
    }
  }

  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Format lock duration
  const formatLockDuration = () => {
    const now = new Date()
    const diff = Math.floor((now - lockTime) / 1000) // seconds

    if (diff < 60) {
      return `${diff} detik`
    }

    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60

    return `${minutes} menit ${seconds} detik`
  }

  if (!isLocked) {
    return null // Don't render if unlocked
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 opacity-50"></div>

      {/* Lock Screen Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Lock Icon and User Info */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Sesi Terkunci
          </h1>
          <p className="text-gray-300 mb-4">
            Sesi Anda dikunci karena tidak ada aktivitas
          </p>

          {/* User Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 inline-block">
            <p className="text-white font-medium">{user?.fullName || 'User'}</p>
            <p className="text-gray-400 text-sm">{user?.username || 'username'}</p>
            <p className="text-orange-400 text-xs mt-2">
              Terkunci selama {formatLockDuration()}
            </p>
          </div>
        </div>

        {/* Unlock Form */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">Unlock Gagal</p>
                <p className="text-red-300 text-sm mt-1">Password salah. Silakan coba lagi.</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {notification && notification.type === 'success' && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-400 text-sm font-medium">{notification.message}</p>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-6">
            {/* Password Field */}
            <div>
              <label htmlFor="unlockPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Masukkan password untuk membuka kunci
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={inputRef}
                  id="unlockPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Password"
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

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Membuka...</span>
                </div>
              ) : (
                'Buka Kunci'
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-transparent hover:bg-gray-700/50 disabled:bg-transparent disabled:cursor-not-allowed text-gray-400 hover:text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 border border-gray-600"
            >
              Keluar dari Akun
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                <Lock className="w-4 h-4 inline mr-1" />
                Keamanan: Aplikasi terkunci otomatis setelah 30 menit tidak ada aktivitas
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            Smart Mill Scale v1.0.0 | Layar Kunci Otomatis
          </p>
        </div>
      </div>
    </div>
  )
}

export default LockScreen
