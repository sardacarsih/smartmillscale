import React, { useState } from 'react'
import { X, User, Mail, Shield, Calendar, Key, Clock, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const UserDetailsModal = ({ user, activity, isLoadingActivity, onClose, onResetPassword }) => {
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // Role configuration
  const roleConfig = {
    'ADMIN': { color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Administrator', icon: Shield },
    'SUPERVISOR': { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Supervisor', icon: Shield },
    'TIMBANGAN': { color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Operator Timbangan', icon: User },
    'GRADING': { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Operator Grading', icon: User }
  }

  const userRole = roleConfig[user?.role] || roleConfig['TIMBANGAN']
  const RoleIcon = userRole.icon

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return '-'
    }
  }

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Tidak pernah'

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 30) return `${diffDays} hari lalu`
    return `${Math.floor(diffDays / 30)} bulan lalu`
  }

  const handlePasswordReset = () => {
    if (newPassword) {
      onResetPassword(newPassword)
      setShowPasswordReset(false)
      setNewPassword('')
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
      case 'LOGOUT':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'LOGIN_FAILED':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'PASSWORD_CHANGED':
      case 'PASSWORD_RESET':
        return <Key className="w-4 h-4 text-yellow-400" />
      case 'USER_CREATED':
      case 'USER_UPDATED':
      case 'USER_DELETED':
        return <User className="w-4 h-4 text-blue-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionText = (action) => {
    switch (action) {
      case 'LOGIN_SUCCESS': return 'Login Berhasil'
      case 'LOGIN_FAILED': return 'Login Gagal'
      case 'LOGOUT': return 'Logout'
      case 'PASSWORD_CHANGED': return 'Password Diubah'
      case 'PASSWORD_RESET': return 'Password Di-reset'
      case 'USER_CREATED': return 'User Dibuat'
      case 'USER_UPDATED': return 'User Diperbarui'
      case 'USER_DELETED': return 'User Dihapus'
      default: return action
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.fullName}</h2>
              <p className="text-gray-400">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" />
                  Informasi Pengguna
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Username</label>
                      <p className="text-white font-medium">@{user?.username}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Nama Lengkap</label>
                      <p className="text-white font-medium">{user?.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white font-medium flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user?.email || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Role</label>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userRole.bgColor} ${userRole.color}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {userRole.label}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user?.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user?.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {user?.mustChangePassword && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                            <Key className="w-3 h-3 mr-1" />
                            Password Expired
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Device ID</label>
                      <p className="text-white font-mono text-xs">{user?.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-400" />
                  Timestamp
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Dibuat</label>
                    <p className="text-white">{formatDate(user?.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Terakhir Update</label>
                    <p className="text-white">{formatDate(user?.updatedAt)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-400">Terakhir Login</label>
                    <p className="text-white">{formatDate(user?.lastLoginAt)}</p>
                    <p className="text-xs text-gray-500">{getRelativeTime(user?.lastLoginAt)}</p>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-400" />
                  Activity Log
                </h3>
                <div className="bg-gray-700/50 rounded-lg overflow-hidden">
                  {isLoadingActivity ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                      <p className="text-gray-400">Memuat activity log...</p>
                    </div>
                  ) : activity && activity.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {activity.map((log, index) => (
                        <div key={log.id || index} className="p-3 border-b border-gray-600 last:border-b-0 hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-start space-x-3">
                            {getActionIcon(log.action)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-white font-medium">{getActionText(log.action)}</p>
                                <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                              </div>
                              {log.details && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                </p>
                              )}
                              {log.errorMsg && (
                                <p className="text-xs text-red-400 mt-1">{log.errorMsg}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <Activity className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p>Tidak ada activity log untuk pengguna ini</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Aksi</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowPasswordReset(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    <span>Reset Password</span>
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Statistik</h3>
                <div className="space-y-3">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Total Login</p>
                    <p className="text-xl font-bold text-white">
                      {activity?.filter(log => log.action === 'LOGIN_SUCCESS').length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Gagal Login</p>
                    <p className="text-xl font-bold text-red-400">
                      {activity?.filter(log => log.action === 'LOGIN_FAILED').length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Password Changes</p>
                    <p className="text-xl font-bold text-blue-400">
                      {activity?.filter(log => log.action === 'PASSWORD_CHANGED' || log.action === 'PASSWORD_RESET').length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-60">
          <div className="bg-gray-800 border border-gray-600 rounded-lg w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
              <p className="text-gray-400 mb-4">
                Reset password untuk: <span className="font-medium text-white">{user?.fullName}</span>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan password baru"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordReset(false)
                    setNewPassword('')
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={!newPassword}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDetailsModal