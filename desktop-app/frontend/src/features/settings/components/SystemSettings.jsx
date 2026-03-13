import { Database, Cloud, Clock, Shield } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'

const SystemSettings = () => {
  const {
    systemSettings,
    updateSystemSettings
  } = useSettingsStore()

  const backupIntervals = [
    { value: 'hourly', label: 'Setiap Jam' },
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' }
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
          <Database className="w-6 h-6 text-green-400" />
          <span>Pengaturan Sistem</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Backup Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Backup & Restore</h3>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={systemSettings.autoBackup}
                  onChange={(e) => updateSystemSettings('autoBackup', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">Auto Backup</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">Otomatis backup database sesuai jadwal</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Interval Backup
              </label>
              <select
                value={systemSettings.backupInterval}
                onChange={(e) => updateSystemSettings('backupInterval', e.target.value)}
                disabled={!systemSettings.autoBackup}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {backupIntervals.map(interval => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Retensi Backup (Hari)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={systemSettings.retentionDays}
                onChange={(e) => updateSystemSettings('retentionDays', parseInt(e.target.value) || 30)}
                disabled={!systemSettings.autoBackup}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">File backup akan dihapus setelah {systemSettings.retentionDays} hari</p>
            </div>
          </div>

          {/* Sync Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-blue-400" />
              <span>Sinkronisasi</span>
            </h3>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={systemSettings.syncEnabled}
                  onChange={(e) => updateSystemSettings('syncEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">Sinkronisasi Otomatis</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">Sinkronkan data ke server secara otomatis</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Interval Sinkronisasi (Menit)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={systemSettings.syncInterval}
                onChange={(e) => updateSystemSettings('syncInterval', parseInt(e.target.value) || 5)}
                disabled={!systemSettings.syncEnabled}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">Setiap {systemSettings.syncInterval} menit</p>
            </div>
          </div>

          {/* Session Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span>Sesi</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Timeout Sesi (Menit)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={systemSettings.sessionTimeout}
                onChange={(e) => updateSystemSettings('sessionTimeout', parseInt(e.target.value) || 30)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">User akan logout otomatis setelah {systemSettings.sessionTimeout} menit</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Maksimum Percobaan Login
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={systemSettings.maxLoginAttempts}
                onChange={(e) => updateSystemSettings('maxLoginAttempts', parseInt(e.target.value) || 3)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Akun akan dikunci setelah {systemSettings.maxLoginAttempts} percobaan gagal</p>
            </div>
          </div>

          {/* System Health */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Kesehatan Sistem</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-gray-300">Database</span>
                <span className="text-green-400 text-sm font-medium">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-gray-300">Storage</span>
                <span className="text-green-400 text-sm font-medium">85% Free</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-gray-300">Last Backup</span>
                <span className="text-gray-400 text-sm font-medium">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings