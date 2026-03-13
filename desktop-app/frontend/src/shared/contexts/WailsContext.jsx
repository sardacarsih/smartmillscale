import React, { createContext, useContext, useMemo } from 'react'
import { PKSService } from '../services/PKSService'
import { DashboardService } from '../services/DashboardService'
import { UserService } from '../services/UserService'
import { SyncService } from '../services/SyncService'
import { MasterDataService } from '../services/MasterDataService'
import { AuditService } from '../services/AuditService'

/**
 * WailsContext - Provides Wails services throughout the app
 * 
 * This context wraps Wails API calls in service classes for:
 * - Better testability (easy to mock)
 * - Separation of concerns
 * - Type safety and documentation
 * - Centralized error handling
 */
const WailsContext = createContext(null)

/**
 * WailsProvider - Context provider for Wails services
 * 
 * @param {Object} props
 * @param {Object} props.wails - Wails bindings object
 * @param {ReactNode} props.children - Child components
 */
export function WailsProvider({ children, wails }) {
    const services = useMemo(() => {
        if (!wails) return null

        return {
            pks: new PKSService(wails),
            dashboard: new DashboardService(wails),
            user: new UserService(wails),
            sync: new SyncService(wails),
            masterData: new MasterDataService(wails),
            audit: new AuditService(wails)
        }
    }, [wails])

    return (
        <WailsContext.Provider value={services}>
            {children}
        </WailsContext.Provider>
    )
}

/**
 * useWailsServices - Hook to access all Wails services
 * 
 * @returns {Object} Object containing all service instances
 * @throws {Error} If used outside WailsProvider
 * 
 * @example
 * const { pks, dashboard } = useWailsServices()
 */
export function useWailsServices() {
    const services = useContext(WailsContext)
    if (!services) {
        throw new Error('useWailsServices must be used within WailsProvider')
    }
    return services
}

/**
 * useWailsService - Hook to access a specific Wails service
 * 
 * @param {string} serviceName - Name of the service ('pks', 'dashboard', etc)
 * @param {Object} options - Configuration options
 * @param {boolean} options.optional - If true, return null instead of throwing when not available
 * @returns {Object|null} Service instance or null if optional and not available
 * @throws {Error} If used outside WailsProvider (unless optional=true)
 * 
 * @example
 * const pksService = useWailsService('pks')
 * const data = await pksService.getStatistics()
 * 
 * @example
 * // Optional mode - won't throw if not available
 * const userService = useWailsService('user', { optional: true })
 * if (userService) {
 *   await userService.login(username, password)
 * }
 */
export function useWailsService(serviceName, { optional = false } = {}) {
    const services = useContext(WailsContext)

    // Handle missing context
    if (!services) {
        if (optional) {
            console.warn(`[useWailsService] WailsContext not available for '${serviceName}', returning null`)
            return null
        }
        throw new Error('useWailsServices must be used within WailsProvider')
    }

    const service = services[serviceName]

    // Handle missing service
    if (!service) {
        if (optional) {
            console.warn(`[useWailsService] Service '${serviceName}' not found, returning null. Available: ${Object.keys(services).join(', ')}`)
            return null
        }
        throw new Error(`Service '${serviceName}' not found. Available services: ${Object.keys(services).join(', ')}`)
    }

    return service
}
