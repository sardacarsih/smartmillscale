import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  GetSystemSettings,
  UpdateSystemSettings,
  TestCOMPortConnection
} from '../../../../wailsjs/go/main/App'

const DEFAULT_GENERAL_SETTINGS = {
  siteName: 'Smart Mill Scale',
  siteDescription: 'Sistem Manajemen Timbangan Digital',
  language: 'id',
  timezone: 'Asia/Jakarta',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24'
}

const DEFAULT_SYSTEM_SETTINGS = {
  autoBackup: true,
  backupInterval: 'daily',
  retentionDays: 30,
  syncEnabled: true,
  syncInterval: 5,
  sessionTimeout: 30,
  maxLoginAttempts: 3
}

const DEFAULT_SERIAL_SETTINGS = {
  port: 'COM1',
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  timeout: 5000,
  retryAttempts: 3
}

const DEFAULT_SECURITY_SETTINGS = {
  passwordMinLength: 6,
  passwordRequireUppercase: false,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  sessionTimeoutMinutes: 30,
  lockScreenAfterMinutes: 10
}

const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'PT. Smart Mill Scale',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyCode: 'SMS',
  ticketDateFormat: 'YYYYMM',
  ticketDigits: 4,
  ticketSeparator: '-'
}

const composeSettings = (state) => ({
  general: state.generalSettings,
  system: state.systemSettings,
  serial: state.serialSettings,
  security: state.securitySettings,
  company: state.companySettings
})

const mergeWithDefaults = (payload = {}) => ({
  generalSettings: {
    ...DEFAULT_GENERAL_SETTINGS,
    ...(payload.general || {})
  },
  systemSettings: {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...(payload.system || {})
  },
  serialSettings: {
    ...DEFAULT_SERIAL_SETTINGS,
    ...(payload.serial || {})
  },
  securitySettings: {
    ...DEFAULT_SECURITY_SETTINGS,
    ...(payload.security || {})
  },
  companySettings: {
    ...DEFAULT_COMPANY_SETTINGS,
    ...(payload.company || {})
  }
})

const useSettingsStore = create(
  devtools(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,
      hasChanges: false,

      generalSettings: { ...DEFAULT_GENERAL_SETTINGS },
      systemSettings: { ...DEFAULT_SYSTEM_SETTINGS },
      serialSettings: { ...DEFAULT_SERIAL_SETTINGS },
      securitySettings: { ...DEFAULT_SECURITY_SETTINGS },
      companySettings: { ...DEFAULT_COMPANY_SETTINGS },

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

      updateCompanySettings: (field, value) => {
        set(state => ({
          companySettings: {
            ...state.companySettings,
            [field]: value
          },
          hasChanges: true
        }))
      },

      resetChanges: () => {
        set({ hasChanges: false })
      },

      // Load all settings from backend
      loadSettings: async () => {
        set({ isLoading: true, error: null })

        try {
          const settingsJSON = await GetSystemSettings()
          const payload = JSON.parse(settingsJSON)
          const merged = mergeWithDefaults(payload)

          set({
            ...merged,
            settings: {
              general: merged.generalSettings,
              system: merged.systemSettings,
              serial: merged.serialSettings,
              security: merged.securitySettings,
              company: merged.companySettings
            },
            isLoading: false,
            hasChanges: false
          })

          return { success: true }
        } catch (error) {
          const merged = mergeWithDefaults()
          set({
            ...merged,
            settings: {
              general: merged.generalSettings,
              system: merged.systemSettings,
              serial: merged.serialSettings,
              security: merged.securitySettings,
              company: merged.companySettings
            },
            isLoading: false,
            hasChanges: false
          })
          return { success: true }
        }
      },

      // Save all settings to backend
      saveSettings: async () => {
        set({ isLoading: true, error: null })

        try {
          const payload = composeSettings(get())
          await UpdateSystemSettings(JSON.stringify(payload))

          set({
            settings: payload,
            isLoading: false,
            hasChanges: false
          })

          return { success: true, message: 'Pengaturan berhasil disimpan!' }
        } catch (error) {
          set({
            error: error.message || 'Gagal menyimpan pengaturan',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      // Test serial connection against backend diagnostics
      testSerialConnection: async () => {
        set({ isLoading: true, error: null })

        try {
          const { serialSettings } = get()
          const portName = (serialSettings.port || '').trim()

          if (!portName) {
            throw new Error('Port serial harus diisi sebelum pengujian koneksi')
          }

          const responseJSON = await TestCOMPortConnection(portName)
          const response = JSON.parse(responseJSON)

          const canUsePort = Boolean(response.canRead && response.canWrite)
          if (!canUsePort) {
            if (response.requiresAdmin) {
              throw new Error(`Port ${portName} memerlukan hak administrator`) 
            }
            throw new Error(response.errorMessage || `Port ${portName} tidak dapat diakses`)
          }

          set({ isLoading: false })
          return {
            success: true,
            message: `Koneksi serial ${portName} berhasil!`
          }
        } catch (error) {
          set({
            error: error.message || 'Gagal menguji koneksi serial',
            isLoading: false
          })
          return { success: false, error: error.message }
        }
      },

      exportSettings: async () => {
        set({ isLoading: true, error: null })

        try {
          const { settings } = get()

          const exportData = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            settings
          }

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

      importSettings: async (file) => {
        set({ isLoading: true, error: null })

        try {
          const text = await file.text()
          const data = JSON.parse(text)

          if (!data.settings) {
            throw new Error('Format file pengaturan tidak valid')
          }

          const merged = mergeWithDefaults(data.settings)
          set({
            ...merged,
            settings: {
              general: merged.generalSettings,
              system: merged.systemSettings,
              serial: merged.serialSettings,
              security: merged.securitySettings,
              company: merged.companySettings
            },
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

      resetToDefaults: async () => {
        set({ isLoading: true, error: null })

        try {
          const merged = mergeWithDefaults()
          set({
            ...merged,
            settings: {
              general: merged.generalSettings,
              system: merged.systemSettings,
              serial: merged.serialSettings,
              security: merged.securitySettings,
              company: merged.companySettings
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
      }
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
