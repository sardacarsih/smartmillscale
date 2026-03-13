import React, { useState, useMemo } from 'react'
import {
  Edit, Trash2, Eye, Key, Shield, User, Mail, Calendar,
  CheckCircle, XCircle, AlertCircle, ArrowUpDown, Users, Filter, Star
} from 'lucide-react'

const UserTable = ({
  users,
  selectedUsers,
  isLoading,
  onSelectUser,
  onSelectAll,
  onEdit,
  onDelete,
  onResetPassword,
  onViewDetails,
  onSort,
  pagination
}) => {
  const [viewMode, setViewMode] = useState('grouped') // 'grouped' | 'table'
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all')

  // Enhanced role configuration with visual themes
  const roleConfig = {
    'ADMIN': {
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      gradientBg: 'from-purple-900/20 to-purple-800/10',
      label: 'Administrator',
      icon: Shield,
      description: 'Full system access',
      userCount: 0
    },
    'SUPERVISOR': {
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      gradientBg: 'from-blue-900/20 to-blue-800/10',
      label: 'Supervisor',
      icon: Shield,
      description: 'Team supervision',
      userCount: 0
    },
    'TIMBANGAN': {
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      gradientBg: 'from-green-900/20 to-green-800/10',
      label: 'Operator Timbangan',
      icon: User,
      description: 'Weighing operations',
      userCount: 0
    },
    'GRADING': {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      gradientBg: 'from-yellow-900/20 to-yellow-800/10',
      label: 'Operator Grading',
      icon: Star,
      description: 'Quality grading',
      userCount: 0
    }
  }

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

  // Memoized user grouping and filtering
  const { usersByRole, filteredUsers, roleStats } = useMemo(() => {
    // Update role counts
    const updatedRoleConfig = { ...roleConfig }
    Object.keys(updatedRoleConfig).forEach(role => {
      updatedRoleConfig[role].userCount = users.filter(user => user.role === role).length
    })

    // Group users by role
    const grouped = users.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = []
      }
      acc[user.role].push(user)
      return acc
    }, {})

    // Filter users based on selected role
    const filtered = selectedRoleFilter === 'all'
      ? users
      : users.filter(user => user.role === selectedRoleFilter)

    // Calculate role statistics
    const stats = Object.keys(updatedRoleConfig).map(role => ({
      role,
      ...updatedRoleConfig[role],
      activeUsers: (grouped[role] || []).filter(user => user.isActive).length,
      totalUsers: (grouped[role] || []).length
    }))

    return {
      usersByRole: grouped,
      filteredUsers: filtered,
      roleStats: stats,
      roleConfig: updatedRoleConfig
    }
  }, [users, selectedRoleFilter])

  const isAllSelected = users.length > 0 && selectedUsers.length === users.length
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < users.length

  // User Card Component for Grouped View
  const UserCard = ({ user }) => {
    const userRole = roleConfig[user.role] || roleConfig['TIMBANGAN']
    const RoleIcon = userRole.icon
    const isSelected = selectedUsers.includes(user.id)

    return (
      <div
        className={`relative bg-gradient-to-br ${userRole.gradientBg} border ${userRole.borderColor} rounded-lg p-4 hover:shadow-lg transition-all duration-300 ${
          isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
        }`}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-3 right-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectUser(user.id)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>

        {/* User Avatar and Basic Info */}
        <div className="flex items-start space-x-3 mb-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${userRole.gradientBg} border ${userRole.borderColor} flex items-center justify-center`}>
            <User className="w-6 h-6 text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate">{user.fullName}</h3>
            <p className="text-gray-400 text-sm">@{user.username}</p>
            <div className="flex items-center mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${userRole.bgColor} ${userRole.color}`}>
                <RoleIcon className="w-3 h-3 mr-1" />
                {userRole.label}
              </span>
            </div>
          </div>
        </div>

        {/* User Status */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            user.isActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {user.isActive ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Aktif
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Nonaktif
              </>
            )}
          </span>
          {user.mustChangePassword && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
              <AlertCircle className="w-3 h-3 mr-1" />
              Password Expired
            </span>
          )}
        </div>

        {/* Contact Info */}
        {user.email && (
          <div className="flex items-center text-gray-400 text-sm mb-2">
            <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        )}

        {/* Last Login */}
        <div className="text-gray-500 text-xs mb-3">
          {user.lastLoginAt ? (
            <div>
              <div>Last login: {formatDate(user.lastLoginAt)}</div>
              <div className="text-gray-600">
                {(() => {
                  const lastLogin = new Date(user.lastLoginAt)
                  const now = new Date()
                  const diffHours = Math.floor((now - lastLogin) / (1000 * 60 * 60))

                  if (diffHours < 1) return 'Baru saja'
                  if (diffHours < 24) return `${diffHours} jam lalu`
                  const diffDays = Math.floor(diffHours / 24)
                  if (diffDays < 30) return `${diffDays} hari lalu`
                  return `${Math.floor(diffDays / 30)} bulan lalu`
                })()}
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <XCircle className="w-3 h-3 mr-1" />
              Belum pernah login
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onViewDetails(user)}
              className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700/50 rounded transition-all duration-200"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(user)}
              className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-700/50 rounded transition-all duration-200"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onResetPassword(user)}
              className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-gray-700/50 rounded transition-all duration-200"
              title="Reset Password"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(user)}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700/50 rounded transition-all duration-200"
              title="Hapus"
              disabled={user.role === 'ADMIN'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-gray-500 text-xs">
            ID: {user.id.slice(0, 8)}...
          </div>
        </div>
      </div>
    )
  }

  // Quick Filter Chips Component
  const QuickFilterChips = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => setSelectedRoleFilter('all')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          selectedRoleFilter === 'all'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        <Users className="w-4 h-4 inline mr-2" />
        Semua ({users.length})
      </button>
      {roleStats.map(({ role, label, totalUsers, color, icon: Icon }) => (
        <button
          key={role}
          onClick={() => setSelectedRoleFilter(role)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedRoleFilter === role
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Icon className="w-4 h-4 inline mr-2" />
          {label} ({totalUsers})
        </button>
      ))}
    </div>
  )

  if (isLoading && users.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Memuat data pengguna...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
      {/* Table Info */}
      <div className="px-6 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Menampilkan {users.length} dari {pagination.total} pengguna
          {pagination.total > pagination.pageSize && (
            <span className="ml-2">
              (Halaman {pagination.page} dari {pagination.totalPages})
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input && isIndeterminate) {
                        input.indeterminate = true
                      }
                    }}
                    onChange={onSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center space-x-1 text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <span>Pengguna</span>
                  <button
                    onClick={() => onSort('full_name', pagination.sortBy === 'full_name' && pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center space-x-1 text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <span>Role</span>
                  <button
                    onClick={() => onSort('role', pagination.sortBy === 'role' && pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center space-x-1 text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <span>Status</span>
                  <button
                    onClick={() => onSort('is_active', pagination.sortBy === 'is_active' && pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center space-x-1 text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <span>Email</span>
                  <button
                    onClick={() => onSort('email', pagination.sortBy === 'email' && pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center space-x-1 text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <span>Terakhir Login</span>
                  <button
                    onClick={() => onSort('last_login_at', pagination.sortBy === 'last_login_at' && pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <User className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-lg mb-1">Tidak ada pengguna ditemukan</p>
                    <p className="text-gray-500 text-sm">
                      Coba ubah filter atau tambah pengguna baru
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const userRole = roleConfig[user.role] || roleConfig['TIMBANGAN']
                const RoleIcon = userRole.icon
                const isSelected = selectedUsers.includes(user.id)

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-700/30 transition-colors ${isSelected ? 'bg-blue-900/20' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectUser(user.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.isActive ? 'bg-gray-600' : 'bg-gray-700'
                        }`}>
                          <User className="w-6 h-6 text-gray-300" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.fullName}</div>
                          <div className="text-gray-400 text-sm flex items-center">
                            @{user.username}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Dibuat: {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userRole.bgColor} ${userRole.color}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {userRole.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Nonaktif
                            </>
                          )}
                        </span>
                        {user.mustChangePassword && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Password Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.email ? (
                        <div className="flex items-center text-gray-400 text-sm">
                          <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-xs" title={user.email}>
                            {user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-400 text-sm">
                        {user.lastLoginAt ? (
                          <div className="flex flex-col">
                            <span>{formatDate(user.lastLoginAt)}</span>
                            <span className="text-xs text-gray-500">
                              {(() => {
                                const lastLogin = new Date(user.lastLoginAt)
                                const now = new Date()
                                const diffHours = Math.floor((now - lastLogin) / (1000 * 60 * 60))

                                if (diffHours < 1) return 'Baru saja'
                                if (diffHours < 24) return `${diffHours} jam lalu`
                                const diffDays = Math.floor(diffHours / 24)
                                if (diffDays < 30) return `${diffDays} hari lalu`
                                return `${Math.floor(diffDays / 30)} bulan lalu`
                              })()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500">
                            <XCircle className="w-3 h-3 mr-1" />
                            Belum pernah login
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onViewDetails(user)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700/50 rounded transition-all duration-200"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(user)}
                          className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-700/50 rounded transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onResetPassword(user)}
                          className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-700/50 rounded transition-all duration-200"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(user)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700/50 rounded transition-all duration-200"
                          title="Hapus"
                          disabled={user.role === 'ADMIN'} // Prevent deleting admin
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Loading overlay for pagination */}
      {isLoading && users.length > 0 && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}

export default UserTable