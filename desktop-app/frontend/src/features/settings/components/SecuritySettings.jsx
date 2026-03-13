import { Shield, Lock, Clock, Key } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'

const SecuritySettings = () => {
  const {
    securitySettings,
    updateSecuritySettings
  } = useSettingsStore()

  const PasswordStrengthIndicator = ({ password }) => {
    let strength = 0
    let message = ''
    let color = ''

    if (password.length >= securitySettings.passwordMinLength) strength++
    if (securitySettings.passwordRequireUppercase && /[A-Z]/.test(password)) strength++
    if (securitySettings.passwordRequireNumbers && /\d/.test(password)) strength++
    if (securitySettings.passwordRequireSymbols && /[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 1) {
      message = 'Lemah'
      color = 'text-red-400'
    } else if (strength === 2) {
      message = 'Sedang'
      color = 'text-yellow-400'
    } else if (strength === 3) {
      message = 'Kuat'
      color = 'text-blue-400'
    } else {
      message = 'Sangat Kuat'
      color = 'text-green-400'
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              strength <= 1 ? 'bg-red-400' : strength === 2 ? 'bg-yellow-400' : strength === 3 ? 'bg-blue-400' : 'bg-green-400'
            }`}
            style={{ width: `${(strength / 4) * 100}%` }}
          ></div>
        </div>
        <span className={`text-sm font-medium ${color}`}>{message}</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
          <Shield className="w-6 h-6 text-red-400" />
          <span>Pengaturan Keamanan</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Password Policies */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-400" />
              <span>Kebijakan Password</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Panjang Password Minimum
              </label>
              <input
                type="number"
                min="4"
                max="50"
                value={securitySettings.passwordMinLength}
                onChange={(e) => updateSecuritySettings('passwordMinLength', parseInt(e.target.value) || 6)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Password minimal {securitySettings.passwordMinLength} karakter</p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordRequireUppercase}
                  onChange={(e) => updateSecuritySettings('passwordRequireUppercase', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">Wajib Huruf Besar</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">Password harus mengandung huruf besar (A-Z)</p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordRequireNumbers}
                  onChange={(e) => updateSecuritySettings('passwordRequireNumbers', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">Wajib Angka</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">Password harus mengandung angka (0-9)</p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordRequireSymbols}
                  onChange={(e) => updateSecuritySettings('passwordRequireSymbols', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">Wajib Simbol</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">Password harus mengandung simbol (!@#$%^&*)</p>
            </div>

            {/* Password Strength Preview */}
            <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Preview Kekuatan Password</h4>
              <input
                type="password"
                placeholder="Test password..."
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Kekuatan:</span>
                  <PasswordStrengthIndicator password="TestPass123!" />
                </div>
              </div>
            </div>
          </div>

          {/* Session Security */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span>Keamanan Sesi</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Timeout Sesi (Menit)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={securitySettings.sessionTimeoutMinutes}
                onChange={(e) => updateSecuritySettings('sessionTimeoutMinutes', parseInt(e.target.value) || 30)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Sesi akan otomatis logout setelah {securitySettings.sessionTimeoutMinutes} menit tidak aktif</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Lock Screen (Menit)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={securitySettings.lockScreenAfterMinutes}
                onChange={(e) => updateSecuritySettings('lockScreenAfterMinutes', parseInt(e.target.value) || 10)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Screen akan terkunci setelah {securitySettings.lockScreenAfterMinutes} menit tidak aktif</p>
            </div>

            {/* Security Status */}
            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-md font-medium text-white mb-4 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-green-400" />
                <span>Status Keamanan</span>
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">Kebijakan Password</span>
                  <span className="text-green-400 text-sm font-medium">Aktif</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">Auto Logout</span>
                  <span className="text-green-400 text-sm font-medium">{securitySettings.sessionTimeoutMinutes} menit</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">Auto Lock</span>
                  <span className="text-green-400 text-sm font-medium">{securitySettings.lockScreenAfterMinutes} menit</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">Enkripsi</span>
                  <span className="text-green-400 text-sm font-medium">AES-256</span>
                </div>
              </div>
            </div>

            {/* Security Tips */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Tips Keamanan</span>
              </h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Gunakan password yang unik dan sulit ditebak</li>
                <li>• Jangan berbagi password dengan orang lain</li>
                <li>• Ganti password secara berkala</li>
                <li>• Selalu logout setelah selesai menggunakan aplikasi</li>
                <li>• Laporkan aktivitas mencurigakan ke administrator</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecuritySettings