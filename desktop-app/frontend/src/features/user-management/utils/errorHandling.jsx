import React from 'react'

// Error handling utilities for user management

export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

export const ErrorMessages = {
  [ErrorTypes.NETWORK_ERROR]: 'Terjadi kesalahan koneksi. Periksa koneksi internet Anda.',
  [ErrorTypes.VALIDATION_ERROR]: 'Data yang dimasukkan tidak valid.',
  [ErrorTypes.AUTHORIZATION_ERROR]: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
  [ErrorTypes.NOT_FOUND_ERROR]: 'Data tidak ditemukan.',
  [ErrorTypes.CONFLICT_ERROR]: 'Terjadi konflik data. Mungkin data sudah ada.',
  [ErrorTypes.SERVER_ERROR]: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  [ErrorTypes.UNKNOWN_ERROR]: 'Terjadi kesalahan yang tidak diketahui.'
}

// Common user management error codes
export const UserErrorCodes = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  LAST_ADMIN_CANNOT_BE_DELETED: 'LAST_ADMIN_CANNOT_BE_DELETED',
  CANNOT_DELETE_SELF: 'CANNOT_DELETE_SELF',
  INVALID_ROLE: 'INVALID_ROLE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  EMAIL_TAKEN: 'EMAIL_TAKEN'
}

export const UserErrorMessages = {
  [UserErrorCodes.USER_NOT_FOUND]: 'Pengguna tidak ditemukan.',
  [UserErrorCodes.USER_ALREADY_EXISTS]: 'Pengguna sudah ada.',
  [UserErrorCodes.INVALID_CREDENTIALS]: 'Username atau password salah.',
  [UserErrorCodes.PASSWORD_TOO_WEAK]: 'Password terlalu lemah. Gunakan password yang lebih kuat.',
  [UserErrorCodes.LAST_ADMIN_CANNOT_BE_DELETED]: 'Tidak dapat menghapus admin terakhir.',
  [UserErrorCodes.CANNOT_DELETE_SELF]: 'Tidak dapat menghapus akun sendiri.',
  [UserErrorCodes.INVALID_ROLE]: 'Role tidak valid.',
  [UserErrorCodes.SESSION_EXPIRED]: 'Sesi telah berakhir. Silakan login kembali.',
  [UserErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Anda tidak memiliki izin yang cukup.',
  [UserErrorCodes.USERNAME_TAKEN]: 'Username sudah digunakan.',
  [UserErrorCodes.EMAIL_TAKEN]: 'Email sudah digunakan.'
}

// Classify error based on HTTP status or error message
export const classifyError = (error) => {
  if (!error) return ErrorTypes.UNKNOWN_ERROR

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('NetworkError') ||
      error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NETWORK')) {
    return ErrorTypes.NETWORK_ERROR
  }

  // HTTP status based classification
  if (error.status || error.response?.status) {
    const status = error.status || error.response?.status

    if (status === 400) return ErrorTypes.VALIDATION_ERROR
    if (status === 401) return ErrorTypes.AUTHORIZATION_ERROR
    if (status === 403) return ErrorTypes.AUTHORIZATION_ERROR
    if (status === 404) return ErrorTypes.NOT_FOUND_ERROR
    if (status === 409) return ErrorTypes.CONFLICT_ERROR
    if (status >= 500) return ErrorTypes.SERVER_ERROR
  }

  // Message based classification
  const message = error.message || error.toString()

  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorTypes.VALIDATION_ERROR
  }
  if (message.includes('unauthorized') || message.includes('forbidden') ||
      message.includes('permission')) {
    return ErrorTypes.AUTHORIZATION_ERROR
  }
  if (message.includes('not found') || message.includes('does not exist')) {
    return ErrorTypes.NOT_FOUND_ERROR
  }
  if (message.includes('conflict') || message.includes('already exists') ||
      message.includes('duplicate')) {
    return ErrorTypes.CONFLICT_ERROR
  }
  if (message.includes('server') || message.includes('internal')) {
    return ErrorTypes.SERVER_ERROR
  }
  if (message.includes('network') || message.includes('connection')) {
    return ErrorTypes.NETWORK_ERROR
  }

  return ErrorTypes.UNKNOWN_ERROR
}

// Extract user-specific error codes
export const extractUserErrorCode = (error) => {
  if (!error) return null

  const message = error.message || error.toString()

  // Check for known error codes in message
  for (const [code, errorMessage] of Object.entries(UserErrorMessages)) {
    if (message.toLowerCase().includes(code.toLowerCase()) ||
        message.toLowerCase().includes(errorMessage.toLowerCase())) {
      return code
    }
  }

  // Check for specific patterns
  if (message.toLowerCase().includes('username') && message.toLowerCase().includes('exist')) {
    return UserErrorCodes.USERNAME_TAKEN
  }
  if (message.toLowerCase().includes('email') && message.toLowerCase().includes('exist')) {
    return UserErrorCodes.EMAIL_TAKEN
  }
  if (message.toLowerCase().includes('last admin') || message.toLowerCase().includes('last administrator')) {
    return UserErrorCodes.LAST_ADMIN_CANNOT_BE_DELETED
  }
  if (message.toLowerCase().includes('delete self') || message.toLowerCase().includes('delete yourself')) {
    return UserErrorCodes.CANNOT_DELETE_SELF
  }
  if (message.toLowerCase().includes('password') && message.toLowerCase().includes('weak')) {
    return UserErrorCodes.PASSWORD_TOO_WEAK
  }

  return null
}

// Get user-friendly error message
export const getErrorMessage = (error) => {
  if (!error) return ErrorMessages[ErrorTypes.UNKNOWN_ERROR]

  // First check for user-specific error codes
  const userErrorCode = extractUserErrorCode(error)
  if (userErrorCode && UserErrorMessages[userErrorCode]) {
    return UserErrorMessages[userErrorCode]
  }

  // Then check for general error types
  const errorType = classifyError(error)
  return ErrorMessages[errorType] || ErrorMessages[ErrorTypes.UNKNOWN_ERROR]
}

// Enhanced error logging
export const logError = (error, context = {}) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: error?.message || error?.toString() || 'Unknown error',
    type: classifyError(error),
    userErrorCode: extractUserErrorCode(error),
    context,
    stack: error?.stack,
    status: error?.status || error?.response?.status,
    url: error?.config?.url,
    method: error?.config?.method
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('User Management Error:', errorData)
  }

  // In production, you might want to send this to a logging service
  // logToService(errorData)

  return errorData
}

// Error boundary for React components
export class UserManagementErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'UserManagement'
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-400 mb-6">
              Maaf, terjadi kesalahan saat memuat halaman manajemen pengguna.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Error handler for async operations
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      const errorData = logError(error, {
        functionName: asyncFn.name,
        args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg)
      })

      if (options.onError) {
        options.onError(errorData)
      }

      // Re-throw the error if not handled
      if (!options.suppressError) {
        throw error
      }

      return null
    }
  }
}

// Retry mechanism for failed operations
export const withRetry = (asyncFn, maxRetries = 3, delay = 1000) => {
  return async (...args) => {
    let lastError

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await asyncFn(...args)
      } catch (error) {
        lastError = error

        // Don't retry on certain error types
        const errorType = classifyError(error)
        if (errorType === ErrorTypes.VALIDATION_ERROR ||
            errorType === ErrorTypes.AUTHORIZATION_ERROR ||
            errorType === ErrorTypes.NOT_FOUND_ERROR) {
          throw error
        }

        // If this is the last attempt, throw the error
        if (i === maxRetries) {
          throw error
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }

    throw lastError
  }
}

// Toast notification helper for errors
export const showErrorToast = (error, toastFunction) => {
  const message = getErrorMessage(error)

  if (toastFunction) {
    toastFunction.error(message)
  } else {
    // Fallback to console if no toast function provided
    console.error('Error:', message)
  }
}

// Validation error formatter
export const formatValidationErrors = (errors) => {
  if (!errors) return []

  const formattedErrors = []

  if (typeof errors === 'string') {
    formattedErrors.push(errors)
  } else if (Array.isArray(errors)) {
    formattedErrors.push(...errors)
  } else if (typeof errors === 'object') {
    Object.values(errors).forEach(error => {
      if (Array.isArray(error)) {
        formattedErrors.push(...error)
      } else if (typeof error === 'string') {
        formattedErrors.push(error)
      }
    })
  }

  return formattedErrors.filter(Boolean)
}

// Create error response object
export const createErrorResponse = (error, context = {}) => {
  return {
    success: false,
    error: {
      message: getErrorMessage(error),
      type: classifyError(error),
      userErrorCode: extractUserErrorCode(error),
      context,
      originalError: error
    }
  }
}

// Check if error is recoverable
export const isRecoverableError = (error) => {
  const errorType = classifyError(error)

  // These errors are not recoverable without user intervention
  const nonRecoverableTypes = [
    ErrorTypes.VALIDATION_ERROR,
    ErrorTypes.AUTHORIZATION_ERROR,
    ErrorTypes.NOT_FOUND_ERROR
  ]

  return !nonRecoverableTypes.includes(errorType)
}