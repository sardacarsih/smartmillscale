import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const useUserManagementStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    users: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    },
    filters: {
      search: '',
      role: '',
      isActive: '',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    },
    selectedUsers: [],

    // UI State
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    successMessage: null,

    // User statistics
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      usersByRole: {},
      recentUsers: 0,
      passwordChangeNeeded: 0
    },

    // User activity
    userActivity: [],
    isLoadingActivity: false,

    // Bulk operations
    isBulkUpdating: false,
    isBulkDeleting: false,
    bulkOperationProgress: 0,

    // Actions
    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error, successMessage: null }),

    setSuccessMessage: (message) => set({ successMessage: message, error: null }),

    clearMessages: () => set({ error: null, successMessage: null }),

    // Update filters
    updateFilters: (newFilters) => {
      set(state => ({
        filters: { ...state.filters, ...newFilters },
        pagination: { ...state.pagination, page: 1 } // Reset to first page
      }))
    },

    // Update pagination
    updatePagination: (pagination) => {
      set(state => ({
        pagination: { ...state.pagination, ...pagination }
      }))
    },

    // Load users with pagination and filters
    loadUsers: async (getUsersPaginatedFunc) => {
      const { pagination, filters } = get()
      console.log('=== FRONTEND loadUsers Called ===')
      console.log('Pagination:', pagination)
      console.log('Filters:', filters)
      console.log('Function available:', !!getUsersPaginatedFunc)

      set({ isLoading: true, error: null })

      try {
        const result = await getUsersPaginatedFunc(
          pagination.page,
          pagination.pageSize,
          filters.search,
          filters.role,
          filters.isActive,
          filters.sortBy,
          filters.sortOrder
        )

        console.log('API Result:', result)

        if (result && result.success) {
          const { users, ...paginationData } = result.data

          set({
            users: users || [],
            pagination: paginationData,
            isLoading: false,
            error: null
          })

          return true
        } else {
          set({
            error: 'Gagal memuat data user',
            isLoading: false
          })
          return false
        }
      } catch (error) {
        set({
          error: error.message || 'Gagal memuat data user. Terjadi kesalahan koneksi.',
          isLoading: false,
          users: []
        })
        return false
      }
    },

    // Refresh current page
    refreshUsers: async () => {
      const { loadUsers } = get()
      return await loadUsers()
    },

    // Go to specific page
    goToPage: async (page) => {
      const { updatePagination, loadUsers } = get()
      updatePagination({ page })
      return await loadUsers()
    },

    // Change page size
    changePageSize: async (pageSize) => {
      const { updatePagination, loadUsers } = get()
      updatePagination({ pageSize, page: 1 })
      return await loadUsers()
    },

    // Search users
    searchUsers: async (searchTerm) => {
      const { updateFilters, loadUsers } = get()
      updateFilters({ search: searchTerm })
      return await loadUsers()
    },

    // Apply filters
    applyFilters: async (filters) => {
      const { updateFilters, loadUsers } = get()
      updateFilters(filters)
      return await loadUsers()
    },

    // Clear filters
    clearFilters: async () => {
      const { updateFilters, loadUsers } = get()
      updateFilters({
        search: '',
        role: '',
        isActive: '',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      })
      return await loadUsers()
    },

    // Sort users
    sortUsers: async (sortBy, sortOrder = 'DESC') => {
      const { updateFilters, loadUsers } = get()
      updateFilters({ sortBy, sortOrder })
      return await loadUsers()
    },

    // Load user statistics
    loadStats: async (getUserStatsFunc) => {
      try {
        const result = await getUserStatsFunc()

        if (result && result.success) {
          set({
            stats: result.data
          })
        }
      } catch (error) {
        console.error('Failed to load user stats:', error)
      }
    },

    // Load user activity
    loadUserActivity: async (getUserActivityFunc, userId, limit = 50) => {
      set({ isLoadingActivity: true, error: null })

      try {
        const result = await getUserActivityFunc(userId, limit)

        if (result && result.success) {
          set({
            userActivity: result.data.logs || [],
            isLoadingActivity: false
          })
          return true
        } else {
          set({
            error: 'Gagal memuat aktivitas user',
            isLoadingActivity: false
          })
          return false
        }
      } catch (error) {
        set({
          error: error.message || 'Gagal memuat aktivitas user',
          isLoadingActivity: false,
          userActivity: []
        })
        return false
      }
    },

    // Create user
    createUser: async (createUserFunc, userData) => {
      console.log('=== STORE USER CREATION START ===')
      console.log('Store: Creating user with data:', userData)
      console.log('Store: CreateUser function available:', !!createUserFunc)

      set({ isCreating: true, error: null })

      try {
        console.log('Store: Calling CreateUser function...')
        const result = await createUserFunc(
          userData.username,
          userData.password,
          userData.email,
          userData.fullName,
          userData.role
        )

        console.log('Store: CreateUser function returned:', result)

        if (result && result.success) {
          console.log('✅ Store: User creation successful')
          console.log('Store: Created user data:', result.user)

          set({
            isCreating: false,
            successMessage: `User "${userData.username}" berhasil dibuat`
          })

          // Refresh user list
          console.log('Store: Refreshing user list...')
          await get().refreshUsers()
          await get().loadStats()
          console.log('✅ Store: User list and stats refreshed')

          return true
        } else {
          console.error('❌ Store: User creation failed - result:', result)
          const errorMsg = result?.error || result?.message || 'Gagal membuat user'
          set({
            error: errorMsg,
            isCreating: false
          })
          return false
        }
      } catch (error) {
        console.error('❌ Store: User creation exception:', error)
        console.error('Store: Error details:', {
          message: error.message,
          stack: error.stack,
          userData: userData
        })
        set({
          error: error.message || 'Gagal membuat user. Terjadi kesalahan.',
          isCreating: false
        })
        return false
      }
    },

    // Update user
    updateUser: async (updateUserFunc, userId, userData) => {
      set({ isUpdating: true, error: null })

      try {
        const result = await updateUserFunc(
          userId,
          userData.fullName,
          userData.email,
          userData.role,
          userData.isActive
        )

        if (result && result.success) {
          set({
            isUpdating: false,
            successMessage: 'User berhasil diperbarui'
          })

          // Refresh user list
          await get().refreshUsers()

          return true
        } else {
          set({
            error: 'Gagal memperbarui user',
            isUpdating: false
          })
          return false
        }
      } catch (error) {
        set({
          error: error.message || 'Gagal memperbarui user. Terjadi kesalahan.',
          isUpdating: false
        })
        return false
      }
    },

    // Delete user
    deleteUser: async (deleteUserFunc, userId) => {
      set({ isDeleting: true, error: null })

      try {
        const result = await deleteUserFunc(userId)

        if (result && result.success) {
          set({
            isDeleting: false,
            successMessage: 'User berhasil dihapus'
          })

          // Refresh user list
          await get().refreshUsers()
          await get().loadStats()

          return true
        } else {
          set({
            error: 'Gagal menghapus user',
            isDeleting: false
          })
          return false
        }
      } catch (error) {
        set({
          error: error.message || 'Gagal menghapus user. Terjadi kesalahan.',
          isDeleting: false
        })
        return false
      }
    },

    // Reset user password
    resetPassword: async (resetPasswordFunc, userId, newPassword = null) => {
      set({ isUpdating: true, error: null })

      try {
        const result = await resetPasswordFunc(userId, newPassword)

        if (result && result.success) {
          set({
            isUpdating: false,
            successMessage: 'Password user berhasil direset'
          })

          // Refresh user list
          await get().refreshUsers()

          return true
        } else {
          set({
            error: 'Gagal reset password user',
            isUpdating: false
          })
          return false
        }
      } catch (error) {
        set({
          error: error.message || 'Gagal reset password user. Terjadi kesalahan.',
          isUpdating: false
        })
        return false
      }
    },

    // User selection for bulk operations
    selectUser: (userId) => {
      set(state => {
        const selectedUsers = state.selectedUsers.includes(userId)
          ? state.selectedUsers.filter(id => id !== userId)
          : [...state.selectedUsers, userId]

        return { selectedUsers }
      })
    },

    selectAllUsers: () => {
      const { users } = get()
      set({ selectedUsers: users.map(user => user.id) })
    },

    deselectAllUsers: () => {
      set({ selectedUsers: [] })
    },

    // Bulk update users
    bulkUpdateUsers: async (bulkUpdateUsersFunc, updates) => {
      const { selectedUsers } = get()

      if (selectedUsers.length === 0) {
        set({ error: 'Tidak ada user yang dipilih' })
        return false
      }

      set({ isBulkUpdating: true, error: null, bulkOperationProgress: 0 })

      try {
        const result = await bulkUpdateUsersFunc(selectedUsers, updates)

        if (result && result.success) {
          set({
            isBulkUpdating: false,
            selectedUsers: [],
            successMessage: result.message || 'Bulk update berhasil',
            bulkOperationProgress: 100
          })

          // Refresh user list
          await get().refreshUsers()
          await get().loadStats()

          return true
        } else {
          set({
            error: 'Gagal melakukan bulk update',
            isBulkUpdating: false,
            bulkOperationProgress: 0
          })
          return false
        }
      } catch (error) {
        set({
          error: error.message || 'Gagal melakukan bulk update. Terjadi kesalahan.',
          isBulkUpdating: false,
          bulkOperationProgress: 0
        })
        return false
      }
    },

    // Bulk delete users
    bulkDeleteUsers: async (bulkDeleteUsersFunc) => {
      const { selectedUsers } = get()

      if (selectedUsers.length === 0) {
        set({ error: 'Tidak ada user yang dipilih' })
        return false
      }

      set({ isBulkDeleting: true, error: null, bulkOperationProgress: 0 })

      try {
        const result = await bulkDeleteUsersFunc(selectedUsers)

        if (result && result.success) {
          set({
            isBulkDeleting: false,
            selectedUsers: [],
            successMessage: result.message || 'Bulk delete berhasil',
            bulkOperationProgress: 100
          })

          // Refresh user list
          await get().refreshUsers()
          await get().loadStats()

          return true
        } else {
          set({
            error: 'Gagal melakukan bulk delete',
            isBulkDeleting: false,
            bulkOperationProgress: 0
          })
          return false
        }
      } catch (error) {
        set({
          error: error.message || 'Gagal melakukan bulk delete. Terjadi kesalahan.',
          isBulkDeleting: false,
          bulkOperationProgress: 0
        })
        return false
      }
    },

    // Clear state
    clearState: () => {
      set({
        users: [],
        selectedUsers: [],
        error: null,
        successMessage: null,
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        isBulkUpdating: false,
        isBulkDeleting: false,
        bulkOperationProgress: 0
      })
    }
  }))
)

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: User management store reloaded')
  })
}

export default useUserManagementStore