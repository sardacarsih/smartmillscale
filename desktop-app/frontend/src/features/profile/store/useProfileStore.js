import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useProfileStore = create(
  devtools(
    (set, get) => ({
      // Profile state
      profile: null,
      isLoading: false,
      error: null,
      isEditing: false,
      isChangingPassword: false,

      // Form state
      editForm: {
        fullName: '',
        email: '',
        phone: ''
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },

      // Actions
      setProfile: (profile) => {
        set({
          profile,
          editForm: {
            fullName: profile.fullName || '',
            email: profile.email || '',
            phone: profile.phone || ''
          }
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      setEditing: (editing) => set({ isEditing: editing }),
      setChangingPassword: (changing) => set({ isChangingPassword: changing }),

      updateEditForm: (field, value) => {
        set(state => ({
          editForm: {
            ...state.editForm,
            [field]: value
          }
        }))
      },

      updatePasswordForm: (field, value) => {
        set(state => ({
          passwordForm: {
            ...state.passwordForm,
            [field]: value
          }
        }))
      },

      resetPasswordForm: () => {
        set({
          passwordForm: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
        })
      },

      // Validation
      validateEditForm: () => {
        const { editForm } = get()
        const errors = {}

        if (!editForm.fullName.trim()) {
          errors.fullName = 'Nama lengkap harus diisi'
        }

        if (!editForm.email.trim()) {
          errors.email = 'Email harus diisi'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
          errors.email = 'Format email tidak valid'
        }

        if (editForm.phone && !/^[\d\s\-\+\(\)]+$/.test(editForm.phone)) {
          errors.phone = 'Format nomor telepon tidak valid'
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors
        }
      },

      validatePasswordForm: () => {
        const { passwordForm } = get()
        const errors = {}

        if (!passwordForm.currentPassword) {
          errors.currentPassword = 'Password saat ini harus diisi'
        }

        if (!passwordForm.newPassword) {
          errors.newPassword = 'Password baru harus diisi'
        } else if (passwordForm.newPassword.length < 6) {
          errors.newPassword = 'Password baru minimal 6 karakter'
        }

        if (!passwordForm.confirmPassword) {
          errors.confirmPassword = 'Konfirmasi password harus diisi'
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          errors.confirmPassword = 'Password baru dan konfirmasi tidak cocok'
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors
        }
      },

      // Mock API calls (will be replaced with real Wails calls)
      updateProfile: async () => {
        set({ isLoading: true, error: null })

        try {
          const { editForm, profile } = get()

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Update local profile
          const updatedProfile = {
            ...profile,
            ...editForm,
            updatedAt: new Date().toISOString()
          }

          set({
            profile: updatedProfile,
            isEditing: false,
            isLoading: false
          })

          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Gagal memperbarui profil',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      changePassword: async () => {
        set({ isLoading: true, error: null })

        try {
          const { passwordForm } = get()

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))

          set({
            isChangingPassword: false,
            isLoading: false
          })

          // Reset password form
          get().resetPasswordForm()

          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Gagal mengubah password',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      }
    }),
    {
      name: 'profile-store'
    }
  )
)

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: Profile store reloaded')
  })
}

export default useProfileStore