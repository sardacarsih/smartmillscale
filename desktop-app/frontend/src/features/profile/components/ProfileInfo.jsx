import { useState } from 'react'
import { User, Mail, Phone, Calendar, Shield, Edit3, Save, X } from 'lucide-react'
import useProfileStore from '../store/useProfileStore'

const ProfileInfo = () => {
  const {
    profile,
    isEditing,
    editForm,
    updateEditForm,
    setEditing,
    updateProfile,
    validateEditForm,
    isLoading,
    error,
    clearError
  } = useProfileStore()

  const [formErrors, setFormErrors] = useState({})

  const handleEdit = () => {
    setEditing(true)
    setFormErrors({})
    clearError()
  }

  const handleCancel = () => {
    setEditing(false)
    setFormErrors({})
    clearError()
  }

  const handleSave = async () => {
    const validation = validateEditForm()

    if (!validation.isValid) {
      setFormErrors(validation.errors)
      return
    }

    setFormErrors({})
    const result = await updateProfile()

    if (!result.success) {
      // Error is already set in store
    }
  }

  const handleInputChange = (field, value) => {
    updateEditForm(field, value)
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  if (!profile) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Informasi Profil</h2>
            <p className="text-gray-400 text-sm">Kelola informasi pribadi Anda</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Profile Information */}
      <div className="space-y-6">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Username
          </label>
          <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">{profile.username}</span>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Nama Lengkap
          </label>
          {!isEditing ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{profile.fullName || 'Tidak diisi'}</span>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.fullName ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Masukkan nama lengkap"
              />
              {formErrors.fullName && (
                <p className="mt-1 text-sm text-red-400">{formErrors.fullName}</p>
              )}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Email
          </label>
          {!isEditing ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{profile.email || 'Tidak diisi'}</span>
            </div>
          ) : (
            <div>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Masukkan email"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
              )}
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Nomor Telepon
          </label>
          {!isEditing ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{profile.phone || 'Tidak diisi'}</span>
            </div>
          ) : (
            <div>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.phone ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Masukkan nomor telepon"
              />
              {formErrors.phone && (
                <p className="mt-1 text-sm text-red-400">{formErrors.phone}</p>
              )}
            </div>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Role
          </label>
          <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">{profile.role}</span>
          </div>
        </div>

        {/* Created At */}
        {profile.createdAt && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Bergabung Sejak
            </label>
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">
                {new Date(profile.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        )}

        {/* Updated At */}
        {profile.updatedAt && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Terakhir Diperbarui
            </label>
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">
                {new Date(profile.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileInfo