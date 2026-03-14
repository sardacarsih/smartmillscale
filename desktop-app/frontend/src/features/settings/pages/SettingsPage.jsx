import { useEffect, useRef, useState } from 'react'
import {
  Settings,
  Building2,
  Globe,
  Database,
  Cpu,
  Shield,
  Save,
  RotateCcw,
  Download,
  Upload,
  Check,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { useAuthStore } from '../../auth'
import useSettingsStore from '../store/useSettingsStore'
import CompanySettings from '../components/CompanySettings'
import GeneralSettings from '../components/GeneralSettings'
import SystemSettings from '../components/SystemSettings'
import SerialSettings from '../components/SerialSettings'
import SecuritySettings from '../components/SecuritySettings'
import { PageShell } from '../../../shared'

const SettingsPage = ({ currentUser, wails, onNavigate, onLogout }) => {
  const { user } = useAuthStore()
  const {
    settings,
    isLoading,
    error,
    hasChanges,
    loadSettings,
    saveSettings,
    exportSettings,
    importSettings,
    resetToDefaults,
    clearError
  } = useSettingsStore()

  const [activeTab, setActiveTab] = useState('company')
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const tabs = [
    { id: 'company', label: 'Perusahaan', icon: Building2 },
    { id: 'general', label: 'Umum', icon: Globe },
    { id: 'system', label: 'Sistem', icon: Database },
    { id: 'serial', label: 'Serial Port', icon: Cpu },
    { id: 'security', label: 'Keamanan', icon: Shield }
  ]

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Handle tab change with unsaved changes warning
  const handleTabChange = (tabId) => {
    if (hasChanges && tabId !== activeTab) {
      setPendingNavigation(tabId)
      setShowUnsavedWarning(true)
    } else {
      setActiveTab(tabId)
    }
  }

  // Confirm navigation with unsaved changes
  const confirmNavigation = () => {
    setShowUnsavedWarning(false)
    if (pendingNavigation) {
      setActiveTab(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  // Cancel navigation
  const cancelNavigation = () => {
    setShowUnsavedWarning(false)
    setPendingNavigation(null)
  }

  // Save settings
  const handleSave = async () => {
    const result = await saveSettings()
    if (result.success) {
      // Show success notification
      setImportResult({ success: true, message: result.message })
      setTimeout(() => setImportResult(null), 3000)
    }
  }

  // Export settings
  const handleExport = async () => {
    const result = await exportSettings()
    setImportResult(result)
    setTimeout(() => setImportResult(null), 3000)
  }

  // Import settings
  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (file) {
      const result = await importSettings(file)
      setImportResult(result)
      if (result.success) {
        setTimeout(() => setImportResult(null), 3000)
      }
    }
    // Reset file input
    event.target.value = ''
  }

  // Reset to defaults
  const handleReset = async () => {
    if (window.confirm('Apakah Anda yakin ingin mereset semua pengaturan ke nilai default? Tindakan ini tidak dapat dibatalkan.')) {
      const result = await resetToDefaults()
      setImportResult(result)
      setTimeout(() => setImportResult(null), 3000)
    }
  }

  // Check if user has permission
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h2>
          <p className="text-gray-400">
            Hanya administrator yang dapat mengakses halaman pengaturan sistem.
          </p>
        </div>
      </div>
    )
  }

  const pageActions = (
    <>
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="flex items-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors duration-200 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <label className="flex cursor-pointer items-center space-x-2 rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors duration-200 hover:bg-gray-600">
        <Upload className="w-4 h-4" />
        <span>Import</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={isLoading}
          className="hidden"
        />
      </label>

      <button
        onClick={handleReset}
        disabled={isLoading}
        className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset</span>
      </button>

      <button
        onClick={handleSave}
        disabled={isLoading || !hasChanges}
        className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Menyimpan...' : 'Simpan'}</span>
      </button>
    </>
  )

  return (
    <PageShell
      title="Smart Mill Scale"
      subtitle="Pengaturan Sistem"
      currentUser={currentUser}
      onLogout={onLogout}
      onNavigate={onNavigate}
      pageTitle="Konfigurasi Sistem"
      pageDescription="Kelola pengaturan aplikasi dengan action bar yang tetap rapi pada resolusi laptop dan desktop."
      pageActions={pageActions}
      contentWidth="standard"
    >

      {/* Alert Messages */}
      {error && (
        <div className="mt-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {importResult && (
        <div className={`mt-4 ${
          importResult.success ? 'animate-pulse' : ''
        }`}>
          <div className={`${importResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-lg p-4`}>
            <div className="flex items-center space-x-3">
              {importResult.success ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
              <p className={importResult.success ? 'text-green-400' : 'text-red-400'}>
                {importResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Perubahan Belum Disimpan</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Anda memiliki perubahan yang belum disimpan. Apakah Anda ingin menyimpan perubahan sebelum beralih tab?
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={cancelNavigation}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Batal
              </button>
              <button
                onClick={confirmNavigation}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200"
              >
                Lanjutkan Tanpa Simpan
              </button>
              <button
                onClick={async () => {
                  await handleSave()
                  confirmNavigation()
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Simpan & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-4">
        {/* Tabs */}
        <div className="mb-8 overflow-x-auto border-b border-gray-700">
          <div className="flex min-w-max gap-1">
            {tabs.map(tab => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 whitespace-nowrap px-4 py-3 border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg">
          {isLoading && !settings && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="ml-3 text-gray-400">Memuat pengaturan...</span>
            </div>
          )}

          {settings && (
            <>
              {activeTab === 'company' && <CompanySettings />}
              {activeTab === 'general' && <GeneralSettings />}
              {activeTab === 'system' && <SystemSettings />}
              {activeTab === 'serial' && <SerialSettings />}
              {activeTab === 'security' && <SecuritySettings />}
            </>
          )}
        </div>

        {/* Save Status */}
        {hasChanges && (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400">Anda memiliki perubahan yang belum disimpan</span>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

export default SettingsPage
