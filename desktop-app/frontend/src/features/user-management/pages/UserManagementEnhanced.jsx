import { useState, useEffect } from 'react'
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, Shield, User, Mail, Calendar, Key,
  Filter, ChevronLeft, ChevronRight, RefreshCw, Download, Users, BarChart3,
  CheckSquare, Square, AlertCircle, CheckCircle, XCircle, Clock, Activity
} from 'lucide-react'

import useUserManagementStore from '../store/useUserManagementStore'
import UserStatsCard from '../components/UserStatsCard'
import UserFilters from '../components/UserFilters'
import UserTable from '../components/UserTable'
import PaginationControls from '../components/PaginationControls'
import BulkOperations from '../components/BulkOperations'
import CreateUserModal from '../components/CreateUserModal'
import EditUserModal from '../components/EditUserModal'
import UserDetailsModal from '../components/UserDetailsModal'
import { getWailsWrapper } from '../../../shared/lib/wailsWrapper'

const UserManagementEnhanced = ({ onBack }) => {
  const wails = getWailsWrapper(true)

  // Require Wails bindings - no fallback
  if (!wails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Wails Environment Required</h1>
          <p className="text-gray-400">User Management requires Wails bindings to function.</p>
          <p className="text-gray-500 text-sm mt-2">Please run this application using: wails dev</p>
        </div>
      </div>
    )
  }

  // Zustand store state
  const {
    users,
    pagination,
    filters,
    selectedUsers,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    successMessage,
    stats,
    userActivity,
    isLoadingActivity,
    isBulkUpdating,
    isBulkDeleting,
    loadUsers,
    loadStats,
    loadUserActivity,
    goToPage,
    changePageSize,
    searchUsers,
    applyFilters,
    clearFilters,
    sortUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    selectUser,
    selectAllUsers,
    deselectAllUsers,
    bulkUpdateUsers,
    bulkDeleteUsers,
    clearMessages,
    setLoading
  } = useUserManagementStore()

  // Local state for modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null)
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showBulkOperations, setShowBulkOperations] = useState(false)

  // Initialize component
  useEffect(() => {
    initializeComponent()
  }, [])

  const initializeComponent = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadUsers(wails.GetUsersPaginated),
        loadStats(wails.GetUserStats)
      ])
    } catch (error) {
      console.error('Failed to initialize user management:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle user actions
  const handleCreateUser = (userData) => {
    console.log('=== FRONTEND USER CREATION START ===')
    console.log('Creating user with data:', userData)
    console.log('Wails bindings available:', !!wails)
    console.log('CreateUser method available:', !!wails.CreateUser)

    // Enhanced error handling and logging
    createUser(wails.CreateUser, userData).then(async (success) => {
      console.log('User creation result:', success)
      if (success) {
        console.log('✅ User creation successful, closing modal')
        setShowCreateModal(false)

        // Verify the user was actually created in the database
        try {
          // Get the user management store to access the last created user
          const state = get()
          const createdUser = state.users.find(u => u.username === userData.username)

          if (createdUser) {
            console.log('Verifying user was saved to database...')
            const verification = await wails.VerifyUserCreated(createdUser.id)
            console.log('Verification result:', verification)

            if (verification && verification.success) {
              console.log('✅ User verification successful - user exists in database')
              console.log('Database user count:', verification.userCount)
            } else {
              console.error('❌ User verification failed - user not found in database')
              console.error('Verification error:', verification?.error || 'Unknown error')
            }
          } else {
            console.warn('⚠️ Could not find created user in local state for verification')
          }
        } catch (verifyError) {
          console.error('❌ Verification process failed:', verifyError)
        }

        // Refresh user list to verify the user was actually created
        setTimeout(() => {
          console.log('Refreshing user list after creation...')
          loadUsers(wails.GetUsersPaginated)
        }, 1000)
      } else {
        console.error('❌ User creation failed')
      }
    }).catch((error) => {
      console.error('❌ User creation error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        userData: userData
      })
    })
  }

  const handleEditUser = (user) => {
    setSelectedUserForEdit(user)
    setShowEditModal(true)
  }

  const handleUpdateUser = (userData) => {
    if (selectedUserForEdit) {
      updateUser(wails.UpdateUser, selectedUserForEdit.id, userData).then((success) => {
        if (success) {
          setShowEditModal(false)
          setSelectedUserForEdit(null)
        }
      })
    }
  }

  const handleDeleteUser = (user) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.fullName}"?`)) {
      deleteUser(wails.DeleteUser, user.id)
    }
  }

  const handleResetPassword = (user, newPassword = null) => {
    const password = newPassword || prompt('Masukkan password baru untuk ' + user.fullName + ':')
    if (password) {
      resetPassword(wails.ResetUserPassword, user.id, password)
    }
  }

  const handleViewDetails = (user) => {
    setSelectedUserForDetails(user)
    setShowDetailsModal(true)
    loadUserActivity(wails.GetUserActivity, user.id)
  }

  // Handle filters and search
  const handleSearch = (searchTerm) => {
    searchUsers(searchTerm)
  }

  const handleFilterChange = (newFilters) => {
    applyFilters(newFilters)
  }

  const handleClearFilters = () => {
    clearFilters()
  }

  // Handle pagination
  const handlePageChange = (page) => {
    goToPage(page)
  }

  const handlePageSizeChange = (pageSize) => {
    changePageSize(pageSize)
  }

  // Handle sorting
  const handleSort = (sortBy, sortOrder) => {
    sortUsers(sortBy, sortOrder)
  }

  // Handle bulk operations
  const handleSelectUser = (userId) => {
    selectUser(userId)
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      deselectAllUsers()
    } else {
      selectAllUsers()
    }
  }

  const handleBulkUpdate = (updates) => {
    bulkUpdateUsers(wails.BulkUpdateUsers, updates).then((success) => {
      if (success) {
        setShowBulkOperations(false)
      }
    })
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedUsers.length} pengguna?`)) {
      bulkDeleteUsers(wails.BulkDeleteUsers).then((success) => {
        if (success) {
          setShowBulkOperations(false)
        }
      })
    }
  }

  // Export functionality (placeholder)
  const handleExport = () => {
    console.log('Export functionality not implemented yet')
  }

  // Refresh data
  const handleRefresh = async () => {
    await initializeComponent()
  }

  // Debug: Test direct user query
  const handleDebugUsers = async () => {
    if (wails && wails.DebugUsers) {
      try {
        console.log('=== DEBUG: Calling DebugUsers ===')
        const result = await wails.DebugUsers()
        console.log('DebugUsers result:', result)

        // Update store with debug data temporarily
        if (result && result.success) {
          set({
            users: result.users || [],
            isLoading: false,
            error: null,
            successMessage: `Debug: Found ${result.total} users`
          })

          // Update pagination
          const totalPages = Math.ceil(result.total / 20)
          set({
            pagination: {
              page: 1,
              pageSize: 20,
              total: result.total,
              totalPages: totalPages,
              hasNext: totalPages > 1,
              hasPrevious: false
            }
          })
        }
      } catch (error) {
        console.error('DebugUsers error:', error)
      }
    }
  }

  // Clear messages
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        clearMessages()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, successMessage])

  if (isLoading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <div className="text-white text-lg">Memuat data pengguna...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-400" />
              Manajemen Pengguna
            </h1>
            <p className="text-gray-400">Kelola pengguna dan peran akses sistem</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
          >
            ← Kembali
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <UserStatsCard
            title="Total Pengguna"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
          />
          <UserStatsCard
            title="Pengguna Aktif"
            value={stats.activeUsers}
            icon={CheckCircle}
            color="green"
          />
          <UserStatsCard
            title="Pengguna Baru"
            value={stats.recentUsers}
            subtitle="30 hari terakhir"
            icon={Calendar}
            color="purple"
          />
          <UserStatsCard
            title="Perlu Ganti Password"
            value={stats.passwordChangeNeeded}
            icon={Key}
            color="yellow"
          />
          <UserStatsCard
            title="Dipilih"
            value={selectedUsers.length}
            subtitle={`${users.length} total`}
            icon={CheckSquare}
            color="indigo"
          />
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari pengguna..."
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Temporary Debug Button */}
            <button
              onClick={handleDebugUsers}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200"
            >
              <span>🔍 Debug Users</span>
            </button>

            {selectedUsers.length > 0 && (
              <button
                onClick={() => setShowBulkOperations(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Bulk Actions ({selectedUsers.length})</span>
              </button>
            )}

            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <UserFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onSort={handleSort}
          usersByRole={stats.usersByRole}
        />
      )}

      {/* Notifications */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-600/20 border border-red-600 rounded-lg flex items-center">
          <XCircle className="w-5 h-5 text-red-400 mr-3" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 px-4 py-3 bg-green-600/20 border border-green-600 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
          <span className="text-green-400">{successMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <UserTable
        users={users}
        selectedUsers={selectedUsers}
        isLoading={isLoading}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onResetPassword={handleResetPassword}
        onViewDetails={handleViewDetails}
        onSort={handleSort}
        pagination={pagination}
      />

      {/* Pagination */}
      <PaginationControls
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          isLoading={isCreating}
        />
      )}

      {showEditModal && selectedUserForEdit && (
        <EditUserModal
          user={selectedUserForEdit}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUserForEdit(null)
          }}
          onSubmit={handleUpdateUser}
          isLoading={isUpdating}
        />
      )}

      {showDetailsModal && selectedUserForDetails && (
        <UserDetailsModal
          user={selectedUserForDetails}
          activity={userActivity}
          isLoadingActivity={isLoadingActivity}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedUserForDetails(null)
          }}
          onResetPassword={(password) => handleResetPassword(selectedUserForDetails, password)}
        />
      )}

      {showBulkOperations && selectedUsers.length > 0 && (
        <BulkOperations
          selectedCount={selectedUsers.length}
          onUpdate={handleBulkUpdate}
          onDelete={handleBulkDelete}
          onClose={() => setShowBulkOperations(false)}
          isLoading={isBulkUpdating || isBulkDeleting}
        />
      )}
    </div>
  )
}

export default UserManagementEnhanced