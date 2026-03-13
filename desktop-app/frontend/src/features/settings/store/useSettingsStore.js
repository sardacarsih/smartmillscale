import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useSettingsStore = create(
  devtools(
    (set, get) => ({
      // Settings state
      settings: null,
      isLoading: false,
      error: null,
      hasChanges: false,

      // General settings
      generalSettings: {
        siteName: 'Smart Mill Scale',
        siteDescription: 'Sistem Manajemen Timbangan Digital',
        language: 'id',
        timezone: 'Asia/Jakarta',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24'
      },

      // System settings
      systemSettings: {
        autoBackup: true,
        backupInterval: 'daily',
        retentionDays: 30,
        syncEnabled: true,
        syncInterval: 5,
        sessionTimeout: 30,
        maxLoginAttempts: 3
      },

      // Serial port settings
      serialSettings: {
        port: 'COM1',
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        timeout: 5000,
        retryAttempts: 3
      },

      // Security settings
      securitySettings: {
        passwordMinLength: 6,
        passwordRequireUppercase: false,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        sessionTimeoutMinutes: 30,
        lockScreenAfterMinutes: 10
      },



      // Actions
      setSettings: (settings) => set({ settings }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      updateGeneralSettings: (field, value) => {
        set(state => ({
          generalSettings: {
            ...state.generalSettings,
            [field]: value
          },
          hasChanges: true
        }))
      },

      updateSystemSettings: (field, value) => {
        set(state => ({
          systemSettings: {
            ...state.systemSettings,
            [field]: value
          },
          hasChanges: true
        }))
      },

      updateSerialSettings: (field, value) => {
        set(state => ({
          serialSettings: {
            ...state.serialSettings,
            [field]: value
          },
          hasChanges: true
        }))
      },

      updateSecuritySettings: (field, value) => {
        set(state => ({
          securitySettings: {
            ...state.securitySettings,
            [field]: value
          },
          hasChanges: true
        }))
      },

      resetChanges: () => {
        set({ hasChanges: false })
      },

      // Load settings from backend
      loadSettings: async () => {
        set({ isLoading: true, error: null })

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Mock settings data
          const mockSettings = {
            general: get().generalSettings,
            system: get().systemSettings,
            serial: get().serialSettings,
            security: get().securitySettings
          }

          set({
            settings: mockSettings,
            isLoading: false,
            hasChanges: false
          })

          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Gagal memuat pengaturan',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Save settings to backend
      saveSettings: async () => {
        set({ isLoading: true, error: null })

        try {
          const { generalSettings, systemSettings, serialSettings, securitySettings } = get()

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500))

          const updatedSettings = {
            general: generalSettings,
            system: systemSettings,
            serial: serialSettings,
            security: securitySettings
          }

          set({
            settings: updatedSettings,
            isLoading: false,
            hasChanges: false
          })

          return { success: true }
        } catch (error) {
          set({
            error: error.message || 'Gagal menyimpan pengaturan',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Test serial connection
      testSerialConnection: async () => {
        set({ isLoading: true, error: null })

        try {
          const { serialSettings } = get()

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Mock test result
          const success = Math.random() > 0.2 // 80% success rate

          if (!success) {
            throw new Error('Tidak dapat terhubung ke port serial. Periksa koneksi dan pengaturan.')
          }

          set({ isLoading: false })
          return { success: true, message: 'Koneksi serial berhasil!' }
        } catch (error) {
          set({
            error: error.message || 'Gagal menguji koneksi serial',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Export settings
      exportSettings: async () => {
        set({ isLoading: true, error: null })

        try {
          const { settings } = get()

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Create export data
          const exportData = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            settings: settings
          }

          // Create download link
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
          })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `smartmillscale-settings-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          set({ isLoading: false })
          return { success: true, message: 'Pengaturan berhasil diekspor!' }
        } catch (error) {
          set({
            error: error.message || 'Gagal mengekspor pengaturan',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Import settings
      importSettings: async (file) => {
        set({ isLoading: true, error: null })

        try {
          // Read file
          const text = await file.text()
          const data = JSON.parse(text)

          // Validate structure
          if (!data.settings) {
            throw new Error('Format file pengaturan tidak valid')
          }

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Update settings
          const { general, system, serial, security } = data.settings

          if (general) set(state => ({ generalSettings: { ...state.generalSettings, ...general } }))
          if (system) set(state => ({ systemSettings: { ...state.systemSettings, ...system } }))
          if (serial) set(state => ({ serialSettings: { ...state.serialSettings, ...serial } }))
          if (security) set(state => ({ securitySettings: { ...state.securitySettings, ...security } }))

          set({
            settings: data.settings,
            isLoading: false,
            hasChanges: true
          })

          return { success: true, message: 'Pengaturan berhasil diimpor!' }
        } catch (error) {
          set({
            error: error.message || 'Gagal mengimpor pengaturan',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Reset to defaults
      resetToDefaults: async () => {
        set({ isLoading: true, error: null })

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Reset to default values
          const defaultGeneralSettings = {
            siteName: 'Smart Mill Scale',
            siteDescription: 'Sistem Manajemen Timbangan Digital',
            language: 'id',
            timezone: 'Asia/Jakarta',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24'
          }

          const defaultSystemSettings = {
            autoBackup: true,
            backupInterval: 'daily',
            retentionDays: 30,
            syncEnabled: true,
            syncInterval: 5,
            sessionTimeout: 30,
            maxLoginAttempts: 3
          }

          const defaultSerialSettings = {
            port: 'COM1',
            baudRate: 9600,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            timeout: 5000,
            retryAttempts: 3
          }

          const defaultSecuritySettings = {
            passwordMinLength: 6,
            passwordRequireUppercase: false,
            passwordRequireNumbers: true,
            passwordRequireSymbols: false,
            sessionTimeoutMinutes: 30,
            lockScreenAfterMinutes: 10
          }

          set({
            generalSettings: defaultGeneralSettings,
            systemSettings: defaultSystemSettings,
            serialSettings: defaultSerialSettings,
            securitySettings: defaultSecuritySettings,
            settings: {
              general: defaultGeneralSettings,
              system: defaultSystemSettings,
              serial: defaultSerialSettings,
              security: defaultSecuritySettings
            },
            isLoading: false,
            hasChanges: true
          })

          return { success: true, message: 'Pengaturan berhasil direset ke default!' }
        } catch (error) {
          set({
            error: error.message || 'Gagal mereset pengaturan',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },


    }),
    {
      name: 'settings-store'
    }
  )
)

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: Settings store reloaded')
  })
}

export default useSettingsStore