// Shared components and utilities barrel exports

// Components
export { default as Notification } from './components/Notification'
export { default as UserBadge } from './components/UserBadge'
export { default as Topbar } from './components/Topbar'
export { default as PageShell } from './components/PageShell'
export { default as ErrorBoundary } from './components/ErrorBoundary'
export { default as VirtualList } from './components/VirtualList'
export { default as LazyImage } from './components/LazyImage'

// Stores
export { default as useNotificationStore } from './store/useNotificationStore'

// Utilities
export * from './utils'
export * as performance from './utils/performance'

// Constants
export * from './constants'

// Hooks
export * from './hooks'
export { useDebounce } from './hooks/useDebounce'
export { useThrottle } from './hooks/useThrottle'
export { useIntersectionObserver } from './hooks/useIntersectionObserver'
