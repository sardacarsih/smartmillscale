/**
 * WidgetCard - Compound component pattern for widgets
 * Provides a flexible container with header, body, and footer slots
 */
import { createContext, useContext } from 'react'

// Widget Context
const WidgetContext = createContext({})

const useWidget = () => {
  const context = useContext(WidgetContext)
  if (!context) {
    throw new Error('Widget compound components must be used within WidgetCard')
  }
  return context
}

// Main WidgetCard Component
const WidgetCard = ({
  children,
  className = '',
  onRefresh,
  onRemove,
  onConfigure,
  isRefreshable = true,
  isConfigurable = true,
  isRemovable = true,
}) => {
  const contextValue = {
    onRefresh,
    onRemove,
    onConfigure,
    isRefreshable,
    isConfigurable,
    isRemovable,
  }

  return (
    <WidgetContext.Provider value={contextValue}>
      <div className={`bg-gray-800 rounded-lg shadow-xl overflow-hidden ${className}`}>
        {children}
      </div>
    </WidgetContext.Provider>
  )
}

// Header Component
const Header = ({ children, className = '' }) => {
  const { onRefresh, onRemove, onConfigure, isRefreshable, isConfigurable, isRemovable } = useWidget()

  return (
    <div className={`px-6 py-4 border-b border-gray-700 flex justify-between items-center ${className}`}>
      <div className="flex-1">
        {children}
      </div>

      <div className="flex gap-2 ml-4">
        {isRefreshable && onRefresh && (
          <button
            onClick={onRefresh}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {isConfigurable && onConfigure && (
          <button
            onClick={onConfigure}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Configure"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {isRemovable && onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            title="Remove"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// Title Component
const Title = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-white ${className}`}>
      {children}
    </h3>
  )
}

// Subtitle Component
const Subtitle = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-gray-400 mt-1 ${className}`}>
      {children}
    </p>
  )
}

// Body Component
const Body = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

// Footer Component
const Footer = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-3 border-t border-gray-700 bg-gray-850 ${className}`}>
      {children}
    </div>
  )
}

// Loading Component
const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-400">{message}</p>
      </div>
    </div>
  )
}

// Empty Component
const Empty = ({ message = 'No data available' }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-gray-400">{message}</p>
    </div>
  )
}

// Error Component
const Error = ({ message = 'An error occurred', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <p className="text-red-400 mb-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

// Attach compound components
WidgetCard.Header = Header
WidgetCard.Title = Title
WidgetCard.Subtitle = Subtitle
WidgetCard.Body = Body
WidgetCard.Footer = Footer
WidgetCard.Loading = Loading
WidgetCard.Empty = Empty
WidgetCard.Error = Error

export default WidgetCard
