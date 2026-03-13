import React from 'react'

/**
 * ServiceBoundary Component
 *
 * A component that enforces authentication and service initialization boundaries
 * for components that require authenticated services.
 *
 * @param {Object} props
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {boolean} props.servicesReady - Whether authenticated services are initialized
 * @param {React.ReactNode} props.children - Components to render when conditions are met
 * @param {React.ReactNode} props.fallback - Optional fallback component when not ready
 * @param {string} props.featureName - Name of the feature for logging purposes
 */
const ServiceBoundary = ({
  isAuthenticated,
  servicesReady,
  children,
  fallback = null,
  featureName = 'unknown'
}) => {
  // If not authenticated, don't render anything (App.jsx will handle login screen)
  if (!isAuthenticated) {
    return null
  }

  // If authenticated but services not ready, show fallback or loading
  if (!servicesReady) {
    if (fallback) {
      return fallback
    }

    // Default loading state
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading {featureName}...</p>
          <p className="text-gray-400 text-xs mt-1">Initializing services</p>
        </div>
      </div>
    )
  }

  // All conditions met - render children
  return <>{children}</>
}

export default ServiceBoundary