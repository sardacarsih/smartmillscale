/**
 * User Roles and Permissions
 */

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  TIMBANGAN: 'TIMBANGAN',
  GRADING: 'GRADING',
}

export const ROLE_HIERARCHY = {
  [USER_ROLES.ADMIN]: 4,
  [USER_ROLES.SUPERVISOR]: 3,
  [USER_ROLES.TIMBANGAN]: 2,
  [USER_ROLES.GRADING]: 1,
}

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.SUPERVISOR]: 'Supervisor',
  [USER_ROLES.TIMBANGAN]: 'Operator Timbangan',
  [USER_ROLES.GRADING]: 'Operator Grading',
}

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'view_audit_logs',
    'manage_settings',
    'access_profile',
    'access_help',
    'record_weighing',
    'view_dashboard',
    'manual_sync',
    'manage_weight_cards',
    'view_weight_cards',
  ],
  [USER_ROLES.SUPERVISOR]: [
    'view_audit_logs',
    'access_profile',
    'access_help',
    'record_weighing',
    'view_dashboard',
    'manual_sync',
    'manage_weight_cards',
    'view_weight_cards',
  ],
  [USER_ROLES.TIMBANGAN]: [
    'access_profile',
    'access_help',
    'record_weighing',
    'view_dashboard',
    'manage_weight_cards',
    'view_weight_cards',
  ],
  [USER_ROLES.GRADING]: [
    'access_profile',
    'access_help',
    'view_dashboard',
    'view_weight_cards',
  ],
}

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Check if a role meets the minimum required role level
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required minimum role
 * @returns {boolean}
 */
export const hasRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}
