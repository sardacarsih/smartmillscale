// Main export file for user management feature

// Material UI Version (NEW - Recommended)
export { default as UserManagementMUI } from './pages/UserManagementMUI'

// Enhanced Components (OLD - Legacy)
export { default as UserManagementEnhanced } from './pages/UserManagementEnhanced'
export { default as UserManagement } from './pages/UserManagementMUI' // Now points to new MUI version
export { default as UserStatsCard } from './components/UserStatsCard'
export { default as UserFilters } from './components/UserFilters'
export { default as UserTable } from './components/UserTable'
export { default as PaginationControls } from './components/PaginationControls'
export { default as BulkOperations } from './components/BulkOperations'
export { default as CreateUserModal } from './components/CreateUserModal'
export { default as EditUserModal } from './components/EditUserModal'
export { default as UserDetailsModal } from './components/UserDetailsModal'

// Store
export { default as useUserManagementStore } from './store/useUserManagementStore'

// Utilities
export * from './utils/validation'
export * from './utils/errorHandling.jsx'

// Default export - enhanced component
export { default } from './pages/UserManagementEnhanced'
