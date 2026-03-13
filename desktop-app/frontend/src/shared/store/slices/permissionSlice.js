export const createPermissionSlice = (set, get) => ({
    // ============================================
    // ROLE-BASED ACCESS CONTROL
    // ============================================
    allowedRoles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING'],
    rolePermissions: {
        ADMIN: {
            canControl: true,      // Can start/stop monitoring
            canView: true,         // Can view weight data
            canAnalyze: true,      // Can access analytics
            canExport: true        // Can export data
        },
        SUPERVISOR: {
            canControl: true,
            canView: true,
            canAnalyze: true,
            canExport: true
        },
        TIMBANGAN: {
            canControl: true,
            canView: true,
            canAnalyze: false,
            canExport: false
        },
        GRADING: {
            canControl: false,     // Read-only access
            canView: true,
            canAnalyze: false,
            canExport: false
        }
    },

    // ============================================
    // ACTIONS - ROLE-BASED ACCESS
    // ============================================

    checkPermission: (userRole, permission) => {
        const { rolePermissions, allowedRoles } = get()

        if (!allowedRoles.includes(userRole)) {
            console.warn(`⚠️ [GlobalWeightStore] Invalid role: ${userRole}`)
            return false
        }

        const rolePerms = rolePermissions[userRole]
        return rolePerms ? rolePerms[permission] === true : false
    },

    getDataForRole: (userRole) => {
        const state = get()
        const canView = state.checkPermission(userRole, 'canView')
        const canAnalyze = state.checkPermission(userRole, 'canAnalyze')
        const canControl = state.checkPermission(userRole, 'canControl')

        if (!canView) {
            return {
                hasAccess: false,
                message: 'No permission to view weight data'
            }
        }

        return {
            hasAccess: true,
            canControl,
            canAnalyze,
            currentWeight: state.currentWeight,
            isStable: state.isStable,
            isConnected: state.isConnected,
            unit: state.unit,
            isMonitoring: state.isMonitoring,
            lastUpdate: state.lastUpdate,
            statistics: canAnalyze ? state.statistics : null,
            eventHistory: canAnalyze ? state.eventHistory : []
        }
    }
})
