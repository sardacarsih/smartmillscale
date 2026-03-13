// Shared hooks barrel exports
export { useActivityTracker } from './useActivityTracker'
export { useInterval } from './useInterval'

// Weight monitoring hooks
export { default as useWeightData } from './useWeightData'
export { default as useWeightMonitoring } from './useWeightMonitoring'
export { default as useWeightHistory } from './useWeightHistory'

// Audit logs hook
export { default as useAuditLogs } from './useAuditLogs'

// Re-export global weight store for convenience
export { default as useGlobalWeightStore } from '../store/useGlobalWeightStore'
