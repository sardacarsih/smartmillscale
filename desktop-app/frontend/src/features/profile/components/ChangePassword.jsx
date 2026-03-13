import { useState } from 'react'
import { Lock, Eye, EyeOff, Key, AlertCircle } from 'lucide-react'
import useProfileStore from '../store/useProfileStore'

const ChangePassword = () => {
  const {
    isChangingPassword,
    passwordForm,
    setChangingPassword,
    updatePasswordForm,
    changePassword,
    validatePasswordForm,
    resetPasswordForm,
    isLoading,
    error,
    clearError
  } = useProfileStore()

  const [formErrors, setFormErrors] = useState({})
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleChangePassword = () => {
    setChangingPassword(true)
    setFormErrors({})
    clearError()
    resetPasswordForm()
  }

  const handleCancel = () => {
    setChangingPassword(false)
    setFormErrors({})
    clearError()
    resetPasswordForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validatePasswordForm()

    if (!validation.isValid) {
      setFormErrors(validation.errors)
      return
    }

    setFormErrors({})
    const result = await changePassword()

    if (!result.success) {
      // Error is already set in store
    }
  }

  const handleInputChange = (field, value) => {
    updatePasswordForm(field, value)
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
            <Key className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Keamanan</h2>
            <p className="text-gray-400 text-sm">Kelola password akun Anda</p>
          </div>
        </div>

        {!isChangingPassword ? (
          <button
            onClick={handleChangePassword}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Ubah Password
          </button>
        ) : null}
      </div>

      {/* Password Change Form */}
      {isChangingPassword ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password Saat Ini
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className={`w-full pl-10 pr-10 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.currentPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Masukkan password saat ini"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {formErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-400">{formErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className={`w-full pl-10 pr-10 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.newPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Masukkan password baru"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {formErrors.newPassword && (
              <p className="mt-1 text-sm text-red-400">{formErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full pl-10 pr-10 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Konfirmasi password baru"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{formErrors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Password harus memenuhi syarat:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  passwordForm.newPassword.length >= 6 ? 'bg-green-400' : 'bg-gray-600'
                }`}></div>
                <span>Minimal 6 karakter</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword.length > 0
                    ? 'bg-green-400'
                    : 'bg-gray-600'
                }`}></div>
                <span>Password baru dan konfirmasi cocok</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Password Anda aman dan terenkripsi</p>
          <p className="text-gray-500 text-xs mt-1">Klik "Ubah Password" untuk mengubah password akun Anda</p>
        </div>
      )}
    </div>
  )
}

export default ChangePassword