import { WailsProvider } from '../contexts/WailsContext'

const LoadingScreen = ({ wails = null, message = 'Loading...', subtitle = '' }) => {
  return (
    <WailsProvider wails={wails}>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{message}</p>
          {subtitle && <p className="text-gray-400 text-sm mt-2">{subtitle}</p>}
        </div>
      </div>
    </WailsProvider>
  )
}

export default LoadingScreen
