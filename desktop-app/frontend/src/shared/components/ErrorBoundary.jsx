import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and store error info
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Terjadi Kesalahan
              </h1>
              <p className="text-gray-300">
                Aplikasi mengalami kesalahan yang tidak terduga. Silakan coba lagi.
              </p>
            </div>

            {/* Error Details (Always shown for debugging) */}
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <details className="text-left">
                  <summary className="cursor-pointer text-red-400 font-medium mb-2">
                    Detail Error (Development Only)
                  </summary>
                  <div className="mt-2 text-xs">
                    <div className="text-red-300 mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div className="text-red-300">
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
              >
                Muat Ulang Aplikasi
              </button>

              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
              >
                Coba Lagi
              </button>
            </div>

            {/* Support Info */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="text-center space-y-2">
                <p className="text-gray-400 text-sm">
                  Jika masalah berlanjut, hubungi administrator
                </p>
                <p className="text-gray-500 text-xs">
                  Smart Mill Scale v1.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary