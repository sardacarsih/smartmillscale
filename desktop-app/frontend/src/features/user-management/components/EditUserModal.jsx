import React, { useState, useEffect } from 'react'
import { X, Mail, Shield, User, CheckCircle } from 'lucide-react'

const EditUserModal = ({ user, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || '',
        isActive: user.isActive !== false // Default to true if undefined
      })
    }
  }, [user])

  const validateForm = () => {
    const newErrors = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nama lengkap harus diisi'
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Nama lengkap minimal 2 karakter'
    }

    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role harus dipilih'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const roleOptions = [
    { value: 'GRADING', label: 'Operator Grading' },
    { value: 'TIMBANGAN', label: 'Operator Timbangan' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'ADMIN', label: 'Administrator' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Edit Pengguna</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 bg-gray-700/30 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <p className="text-white font-medium">@{user?.username}</p>
              <p className="text-gray-400 text-sm">
                Dibuat: {new Date(user?.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nama Lengkap <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="John Doe"
              required
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="user@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Role <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                  errors.role ? 'border-red-500' : 'border-gray-600'
                }`}
                required
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-400">{errors.role}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
              Akun Aktif
            </label>
          </div>

          {/* Warning for admin role */}
          {formData.role === 'ADMIN' && user?.role !== 'ADMIN' && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                <p className="text-xs text-gray-300">
                  Memberikan role Administrator akan memberikan akses penuh ke sistem.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>Update Pengguna</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUserModal