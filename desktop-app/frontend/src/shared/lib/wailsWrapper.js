/**
 * Wails Wrapper
 *
 * Creates a unified wrapper that combines:
 * - Backend Go methods (window.go.main.App)
 * - Wails runtime functions (EventsOn, EventsOff, EventsEmit)
 *
 * This ensures components have access to both backend methods and event handling
 * in a single, consistent interface.
 */

import { EventsOn, EventsOff, EventsEmit } from '../../../wailsjs/runtime/runtime.js'

/**
 * Creates a Wails wrapper with backend methods and runtime functions
 * @returns {Object|null} Unified wails object or null if backend not available
 */
export function createWailsWrapper() {
    const backendMethods = window.go?.main?.App

    if (!backendMethods) {
        console.log('⚠️ [WailsWrapper] Backend methods not available, will use mock')
        return null
    }

    // Verify critical methods exist to ensure bindings are fully loaded
    // This prevents partial initialization where window.go.main.App exists but methods are missing
    if (typeof backendMethods.Login !== 'function') {
        console.warn('⚠️ [WailsWrapper] Backend methods found but Login is missing. Bindings might be incomplete or stale.')
        console.log('📋 [WailsWrapper] Available keys:', Object.keys(backendMethods))
        return null
    }

    // Create wrapper that combines backend methods + runtime functions
    const wrapper = {
        // Spread all backend methods
        ...backendMethods,

        // Add runtime event methods
        EventsOn,
        EventsOff,
        EventsEmit,

        // Helper method to check if wrapper is ready
        isReady: () => true
    }

    console.log('✅ [WailsWrapper] Wails wrapper created successfully')
    console.log('📋 [WailsWrapper] Available methods:', Object.keys(wrapper))

    return wrapper
}

/**
 * Development fallback for when Wails is not available
 * Returns mock implementations to allow frontend development
 */
export function createMockWailsWrapper() {
    console.warn('⚠️ [WailsWrapper] Using mock wrapper for development')

    try {
        const eventListeners = new Map()
        const nowIso = () => new Date().toISOString()
        let masterSyncStatus = {
            syncInProgress: false,
            lastAttemptAt: null,
            lastSuccessAt: null,
            lastResult: null
        }

    return {
        // Mock authentication methods
        Login: async (username, password) => {
            console.log('[Mock] Login:', username)
            // Simulate successful login
            return JSON.stringify({
                success: true,
                data: {
                    user: {
                        id: 'mock-user-1',
                        username: username,
                        full_name: 'Mock User',
                        email: `${username}@example.com`,
                        role: 'admin',
                        active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    session: {
                        id: 'mock-session-1',
                        user_id: 'mock-user-1',
                        token: 'mock-token-' + Math.random().toString(36).substr(2, 9),
                        device_id: 'mock-device-1',
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        created_at: new Date().toISOString()
                    }
                }
            })
        },

        Logout: async () => {
            console.log('[Mock] Logout')
            return JSON.stringify({
                success: true,
                message: 'Logout successful'
            })
        },

        GetCurrentUser: async () => {
            console.log('[Mock] GetCurrentUser')
            // Return mock user if "logged in"
            return JSON.stringify({
                success: true,
                data: {
                    user: {
                        id: 'mock-user-1',
                        username: 'admin',
                        full_name: 'Mock User',
                        email: 'admin@example.com',
                        role: 'admin',
                        active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    session: {
                        id: 'mock-session-1',
                        user_id: 'mock-user-1',
                        token: 'mock-token-active',
                        device_id: 'mock-device-1',
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        created_at: new Date().toISOString()
                    }
                }
            })
        },

        // Mock backend methods
        StartWeightMonitoring: async (role) => {
            console.log('[Mock] StartWeightMonitoring:', role)
            return { success: true, message: 'Mock monitoring started' }
        },

        StopWeightMonitoring: async (role) => {
            console.log('[Mock] StopWeightMonitoring:', role)
            return { success: true }
        },

        GetCurrentWeight: async (role) => {
            // Simulate realistic weight including zero for edge case testing
            const weightPhase = Math.random()
            let mockWeight

            if (weightPhase < 0.3) {
                mockWeight = 0  // 30% chance for zero weight (empty scale)
            } else if (weightPhase < 0.7) {
                mockWeight = 1000 + Math.random() * 500  // Normal weight 1000-1500
            } else {
                mockWeight = 10 + Math.random() * 20  // Small weights 10-30 for testing
            }

            return {
                success: true,
                weight: mockWeight,
                unit: 'kg',
                is_stable: mockWeight === 0 ? true : Math.random() > 0.3, // Zero weight is always stable
                is_connected: true,
                timestamp: new Date().toISOString()
            }
        },

        GetWeightStatus: async (role) => {
            return {
                success: true,
                is_monitoring: true,
                is_connected: true,
                current_weight: 1234.5,
                unit: 'kg',
                is_stable: true
            }
        },

        IsWeightScaleConnected: async () => {
            console.log('[Mock] IsWeightScaleConnected')
            return JSON.stringify({
                isConnected: true,
                port: 'mock-port',
                timestamp: new Date().toISOString()
            })
        },

        IsWeightMonitoringActive: async () => {
            console.log('[Mock] IsWeightMonitoringActive')
            return JSON.stringify({
                isMonitoring: true,
                startedAt: new Date().toISOString()
            })
        },

        // Mock Master Data methods
        GetProducts: async (activeOnly) => {
            console.log('[Mock] GetProducts')
            return JSON.stringify([
                { id: 1, kode_produk: 'TBS', nama_produk: 'Tandan Buah Segar', kategori: 'Raw Material', is_active: true },
                { id: 2, kode_produk: 'CPO', nama_produk: 'Crude Palm Oil', kategori: 'Finished Goods', is_active: true },
                { id: 3, kode_produk: 'PK', nama_produk: 'Palm Kernel', kategori: 'Finished Goods', is_active: true }
            ])
        },
        CreateProduct: async (data, userId) => JSON.stringify({ id: 99, ...JSON.parse(data), is_active: true }),
        UpdateProduct: async (id, data, userId) => JSON.stringify({ id, ...JSON.parse(data), is_active: true }),
        DeleteProduct: async (id, userId) => true,

        GetUnits: async (activeOnly) => {
            console.log('[Mock] GetUnits')
            return JSON.stringify([
                { id: 1, nomor_polisi: 'BK 1234 AB', nama_kendaraan: 'Truck A', jenis_kendaraan: 'Dump Truck', kapasitas_max: 10000, is_active: true },
                { id: 2, nomor_polisi: 'BK 5678 CD', nama_kendaraan: 'Truck B', jenis_kendaraan: 'Fuso', kapasitas_max: 20000, is_active: true }
            ])
        },
        CreateUnit: async (data, userId) => JSON.stringify({ id: 99, ...JSON.parse(data), is_active: true }),
        UpdateUnit: async (id, data, userId) => JSON.stringify({ id, ...JSON.parse(data), is_active: true }),
        DeleteUnit: async (id, userId) => true,

        GetSuppliers: async (activeOnly) => {
            console.log('[Mock] GetSuppliers')
            return JSON.stringify([
                { id: 1, kode_supplier: 'SUP001', nama_supplier: 'PT Sawit Makmur', alamat: 'Medan', kontak: '08123456789', jenis_supplier: 'External', is_active: true },
                { id: 2, kode_supplier: 'SUP002', nama_supplier: 'CV Tani Jaya', alamat: 'Binjai', kontak: '08198765432', jenis_supplier: 'Internal', is_active: true }
            ])
        },
        CreateSupplier: async (data, userId) => JSON.stringify({ id: 99, ...JSON.parse(data), is_active: true }),
        UpdateSupplier: async (id, data, userId) => JSON.stringify({ id, ...JSON.parse(data), is_active: true }),
        DeleteSupplier: async (id, userId) => true,

        GetEstates: async (activeOnly) => {
            console.log('[Mock] GetEstates')
            const now = nowIso()
            return JSON.stringify([
                { id: 1, kode_estate: 'EST01', nama_estate: 'Estate A', luas: 1000, is_active: true, data_source: 'SERVER', last_synced_at: now },
                { id: 2, kode_estate: 'EST02', nama_estate: 'Estate B', luas: 2000, is_active: true, data_source: 'MANUAL', last_synced_at: null }
            ])
        },
        CreateEstate: async (data, userId) => JSON.stringify({ id: 99, ...JSON.parse(data), is_active: true, data_source: 'MANUAL', last_synced_at: null }),
        UpdateEstate: async (id, data, userId) => JSON.stringify({ id, ...JSON.parse(data), is_active: true, data_source: 'MANUAL', last_synced_at: null }),
        DeleteEstate: async (id, userId) => true,

        GetAfdelings: async (activeOnly) => {
            console.log('[Mock] GetAfdelings')
            const now = nowIso()
            return JSON.stringify([
                { id: 1, id_estate: 1, kode_afdeling: 'AFD01', nama_afdeling: 'Afdeling 1', luas: 100, is_active: true, data_source: 'SERVER', last_synced_at: now },
                { id: 2, id_estate: 1, kode_afdeling: 'AFD02', nama_afdeling: 'Afdeling 2', luas: 200, is_active: true, data_source: 'MANUAL', last_synced_at: null }
            ])
        },
        GetAfdelingsByEstate: async (estateId, activeOnly) => {
            console.log('[Mock] GetAfdelingsByEstate')
            const now = nowIso()
            return JSON.stringify([
                { id: 1, id_estate: estateId, kode_afdeling: 'AFD01', nama_afdeling: 'Afdeling 1', luas: 100, is_active: true, data_source: 'SERVER', last_synced_at: now }
            ])
        },
        CreateAfdeling: async (data, userId) => JSON.stringify({ id: 99, ...JSON.parse(data), is_active: true, data_source: 'MANUAL', last_synced_at: null }),
        UpdateAfdeling: async (id, data, userId) => JSON.stringify({ id, ...JSON.parse(data), is_active: true, data_source: 'MANUAL', last_synced_at: null }),
        DeleteAfdeling: async (id, userId) => true,

        GetBlok: async (activeOnly) => {
            console.log('[Mock] GetBlok')
            const now = nowIso()
            return JSON.stringify([
                {
                    id: 1,
                    id_afdeling: 1,
                    kode_blok: 'BLK01',
                    nama_blok: 'Blok A',
                    luas: 10,
                    is_active: true,
                    data_source: 'SERVER',
                    last_synced_at: now,
                    afdeling: {
                        id: 1,
                        id_estate: 1,
                        kode_afdeling: 'AFD01',
                        nama_afdeling: 'Afdeling 1',
                        estate: {
                            id: 1,
                            kode_estate: 'EST01',
                            nama_estate: 'Estate A'
                        }
                    }
                },
                {
                    id: 2,
                    id_afdeling: 1,
                    kode_blok: 'BLK02',
                    nama_blok: 'Blok B',
                    luas: 20,
                    is_active: true,
                    data_source: 'MANUAL',
                    last_synced_at: null,
                    afdeling: {
                        id: 1,
                        id_estate: 1,
                        kode_afdeling: 'AFD01',
                        nama_afdeling: 'Afdeling 1',
                        estate: {
                            id: 1,
                            kode_estate: 'EST01',
                            nama_estate: 'Estate A'
                        }
                    }
                }
            ])
        },
        GetBlokByAfdeling: async (afdelingId, activeOnly) => {
            console.log('[Mock] GetBlokByAfdeling')
            const now = nowIso()
            return JSON.stringify([
                { id: 1, id_afdeling: afdelingId, kode_blok: 'BLK01', nama_blok: 'Blok A', luas: 10, is_active: true, data_source: 'SERVER', last_synced_at: now }
            ])
        },
        CreateBlok: async (data, userId) => JSON.stringify({ id: 99, ...JSON.parse(data), is_active: true, data_source: 'MANUAL', last_synced_at: null }),
        UpdateBlok: async (id, data, userId) => JSON.stringify({ id, ...JSON.parse(data), is_active: true, data_source: 'MANUAL', last_synced_at: null }),
        DeleteBlok: async (id, userId) => true,

        TriggerMasterDataSync: async (requestJSON) => {
            console.log('[Mock] TriggerMasterDataSync', requestJSON)
            const request = requestJSON ? JSON.parse(requestJSON) : {}
            const syncedAt = nowIso()
            const result = {
                success: true,
                isOnline: true,
                triggerSource: request.triggerSource || 'manual',
                scope: Array.isArray(request.scope) && request.scope.length > 0 ? request.scope : ['estate', 'afdeling', 'blok'],
                syncedAt,
                counts: {
                    estate: { created: 0, updated: 1, deactivated: 0, skipped: 0 },
                    afdeling: { created: 0, updated: 1, deactivated: 0, skipped: 0 },
                    blok: { created: 0, updated: 1, deactivated: 0, skipped: 0 }
                },
                error: ''
            }

            masterSyncStatus = {
                syncInProgress: false,
                lastAttemptAt: syncedAt,
                lastSuccessAt: syncedAt,
                lastResult: result
            }

            return JSON.stringify(result)
        },

        GetMasterDataSyncStatus: async () => {
            console.log('[Mock] GetMasterDataSyncStatus')
            return JSON.stringify(masterSyncStatus)
        },

        // Mock API Key methods (fallback only when backend is unavailable)
        GetAPIKeys: async () => {
            console.log('[Mock] GetAPIKeys - Using fallback implementation')
            return JSON.stringify({
                success: false,
                message: 'Backend unavailable. Please run the application with `wails dev` to access API key management features.'
            })
        },

        CreateAPIKey: async (data, userId) => {
            console.log('[Mock] CreateAPIKey - Backend unavailable')
            return JSON.stringify({
                success: false,
                message: 'Backend unavailable. Please run the application with `wails dev` to create API keys.'
            })
        },

        UpdateAPIKey: async (data, userId) => {
            console.log('[Mock] UpdateAPIKey - Backend unavailable')
            return JSON.stringify({
                success: false,
                message: 'Backend unavailable. Please run the application with `wails dev` to update API keys.'
            })
        },

        DeleteAPIKey: async (id, userId) => {
            console.log('[Mock] DeleteAPIKey - Backend unavailable')
            return JSON.stringify({
                success: false,
                message: 'Backend unavailable. Please run the application with `wails dev` to delete API keys.'
            })
        },

        DeactivateAPIKey: async (id, userId) => {
            console.log('[Mock] DeactivateAPIKey - Backend unavailable')
            return JSON.stringify({
                success: false,
                message: 'Backend unavailable. Please run the application with `wails dev` to manage API keys.'
            })
        },

        ReactivateAPIKey: async (id, userId) => {
            console.log('[Mock] ReactivateAPIKey - Backend unavailable')
            return JSON.stringify({
                success: false,
                message: 'Backend unavailable. Please run the application with `wails dev` to manage API keys.'
            })
        },

        // Mock runtime functions
        EventsOn: (eventName, callback) => {
            console.log('[Mock] EventsOn:', eventName)
            if (!eventListeners.has(eventName)) {
                eventListeners.set(eventName, [])
            }
            eventListeners.get(eventName).push(callback)

            // Simulate weight events for development
            if (eventName === 'weight_event') {
                const interval = setInterval(() => {
                    const mockWeight = 1000 + Math.random() * 500
                    const isStable = Math.random() > 0.3

                    const mockEvent = {
                        type: 'weight_change',
                        reading: {
                            weight: mockWeight * 100, // Convert to centesimal (x100) to match backend
                            unit: 'kg',
                            stable: isStable
                        },
                        connected: true,
                        timestamp: new Date().toISOString()
                    }
                    callback(JSON.stringify(mockEvent))
                }, 2000)

                // Store interval for cleanup
                callback._mockInterval = interval
            }
        },

        EventsOff: (eventName) => {
            console.log('[Mock] EventsOff:', eventName)
            const listeners = eventListeners.get(eventName) || []
            listeners.forEach(listener => {
                if (listener._mockInterval) {
                    clearInterval(listener._mockInterval)
                }
            })
            eventListeners.delete(eventName)
        },

        EventsEmit: (eventName, data) => {
            console.log('[Mock] EventsEmit:', eventName, data)
            const listeners = eventListeners.get(eventName) || []
            listeners.forEach(listener => listener(data))
        },

        isReady: () => true,
        isMock: true
    }

    } catch (error) {
        console.error('❌ [WailsWrapper] Error creating mock wrapper:', error)
        throw error
    }
}

/**
 * Get Wails wrapper with automatic fallback to mock in development
 * @param {boolean} allowMock - Whether to allow mock fallback (default: true)
 * @returns {Object} Wails wrapper
 */
export function getWailsWrapper(allowMock = true) {
    try {
        const wrapper = createWailsWrapper()

        if (!wrapper && allowMock) {
            return createMockWailsWrapper()
        }

        return wrapper
    } catch (error) {
        console.error('❌ [WailsWrapper] Error in getWailsWrapper:', error)
        if (allowMock) {
            return createMockWailsWrapper()
        }
        throw error
    }
}


