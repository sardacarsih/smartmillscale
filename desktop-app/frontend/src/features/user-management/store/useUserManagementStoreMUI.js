import { create } from 'zustand'

const useUserManagementStoreMUI = create((set, get) => ({
  // State
  users: [],
  selectedUsers: [],
  isLoading: false,
  error: null,
  successMessage: null,

  // Actions
  setUsers: (users) => set({ users }),

  setSelectedUsers: (selectedUsers) => set({ selectedUsers }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, successMessage: null }),

  setSuccessMessage: (message) => set({ successMessage: message, error: null }),

  clearMessages: () => set({ error: null, successMessage: null }),

  // Load users (using Wails GetAllUsers for simplicity with DataGrid)
  loadUsers: async (wails) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.GetAllUsers()
      if (result && result.success) {
        // Transform data to include 'id' field for DataGrid
        const usersWithId = result.data.map(user => ({
          ...user,
          id: user.id || user.ID, // Ensure lowercase 'id' for DataGrid
        }))
        set({ users: usersWithId, isLoading: false })
      } else {
        set({ error: result?.message || 'Gagal memuat data user', isLoading: false })
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
    }
  },

  // Create user
  createUser: async (wails, userData) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.CreateUser(
        userData.username,
        userData.password,
        userData.email,
        userData.fullName,
        userData.role
      )

      if (result && result.success) {
        set({ successMessage: 'User berhasil dibuat', isLoading: false })
        // Reload users
        await get().loadUsers(wails)
        return true
      } else {
        set({ error: result?.message || 'Gagal membuat user', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return false
    }
  },

  // Update user
  updateUser: async (wails, userID, updates) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.UpdateUser(
        userID,
        updates.fullName,
        updates.email || '',
        updates.role,
        updates.isActive ? 'true' : 'false'
      )

      if (result && result.success) {
        set({ successMessage: 'User berhasil diperbarui', isLoading: false })
        // Reload users
        await get().loadUsers(wails)
        return true
      } else {
        set({ error: result?.message || 'Gagal memperbarui user', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return false
    }
  },

  // Delete user
  deleteUser: async (wails, userID) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.DeleteUser(userID)

      if (result && result.success) {
        set({ successMessage: 'User berhasil dihapus', isLoading: false })
        // Reload users
        await get().loadUsers(wails)
        return true
      } else {
        set({ error: result?.message || 'Gagal menghapus user', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return false
    }
  },

  // Reset password
  resetPassword: async (wails, userID) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.ResetUserPassword(userID, '')

      if (result && result.success) {
        const newPassword = result.data?.newPassword || 'Password berhasil direset'
        set({ successMessage: `Password baru: ${newPassword}`, isLoading: false })
        return { success: true, password: newPassword }
      } else {
        set({ error: result?.message || 'Gagal reset password', isLoading: false })
        return { success: false }
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return { success: false }
    }
  },

  // Update own profile (self-service)
  updateOwnProfile: async (wails, fullName, email) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.UpdateOwnProfile(fullName, email)

      if (result && result.success) {
        set({ successMessage: 'Profil berhasil diperbarui', isLoading: false })
        return true
      } else {
        set({ error: result?.message || 'Gagal memperbarui profil', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return false
    }
  },

  // Change password (self-service)
  changePassword: async (wails, oldPassword, newPassword) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.ChangePassword(oldPassword, newPassword)

      if (result && result.success) {
        set({ successMessage: 'Password berhasil diubah', isLoading: false })
        return true
      } else {
        set({ error: result?.message || 'Gagal mengubah password', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return false
    }
  },

  // Export users to CSV
  exportUsers: async (wails, includeInactive) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.ExportUsersToCSV(includeInactive)

      if (result && result.success) {
        const csvData = result.data?.csv

        // Create download
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        set({ successMessage: 'Data user berhasil diekspor', isLoading: false })
        return true
      } else {
        set({ error: result?.message || 'Gagal mengekspor data', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return false
    }
  },

  // Import users from CSV
  importUsers: async (wails, csvData) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.ImportUsersFromCSV(csvData)

      if (result && result.success) {
        set({ successMessage: result.message, isLoading: false })
        // Reload users
        await get().loadUsers(wails)
        return result.data
      } else {
        set({ error: result?.message || 'Gagal mengimpor data', isLoading: false })
        return null
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return null
    }
  },

  // Bulk delete users
  bulkDeleteUsers: async (wails, userIDs) => {
    set({ isLoading: true, error: null })
    try {
      const result = await wails.BulkDeleteUsers(userIDs)

      if (result && result.success) {
        set({ successMessage: result.message, isLoading: false, selectedUsers: [] })
        // Reload users
        await get().loadUsers(wails)
        return true
      } else {
        set({ error: result?.message || 'Gagal menghapus user', isLoading: false })
        return false
      }
    } catch (error) {
      set({ error: error.message || 'Terjadi kesalahan', isLoading: false })
      return false
    }
  },
}))

export default useUserManagementStoreMUI
