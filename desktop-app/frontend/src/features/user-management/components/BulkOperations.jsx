import React, { useState } from 'react'
import { X, Edit, Trash2, Users, AlertTriangle } from 'lucide-react'

const BulkOperations = ({ selectedCount, onUpdate, onDelete, onClose, isLoading }) => {
  const [activeTab, setActiveTab] = useState('update')
  const [updateForm, setUpdateForm] = useState({
    role: '',
    isActive: '',
    forcePasswordChange: false
  })

  const handleUpdate = () => {
    const updates = {}

    if (updateForm.role) {
      updates.role = updateForm.role
    }

    if (updateForm.isActive !== '') {
      updates.is_active = updateForm.isActive === 'true'
    }

    if (updateForm.forcePasswordChange) {
      updates.must_change_password = true
    }

    if (Object.keys(updates).length === 0) {
      alert('Pilih setidaknya satu field untuk diupdate')
      return
    }

    onUpdate(updates)
  }

  const handleDelete = () => {
    const confirmMessage = `Apakah Anda yakin ingin menghapus ${selectedCount} pengguna?`

    if (window.confirm(confirmMessage)) {
      onDelete()
    }
  }

  const resetForm = () => {
    setUpdateForm({
      role: '',
      isActive: '',
      forcePasswordChange: false
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Bulk Operations</h2>
              <p className="text-gray-400 text-sm">
                {selectedCount} pengguna dipilih
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('update')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'update'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Update Pengguna</span>
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'delete'
                ? 'text-red-400 border-b-2 border-red-400 bg-red-900/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Pengguna</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'update' ? (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-white font-medium mb-1">Update Massal</h3>
                    <p className="text-gray-400 text-sm">
                      Pilih field yang ingin diupdate untuk {selectedCount} pengguna yang dipilih.
                      Field yang tidak diisi akan tidak diubah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Role Update */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Update Role (Opsional)
                  </label>
                  <select
                    value={updateForm.role}
                    onChange={(e) => setUpdateForm({ ...updateForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Tidak mengubah role --</option>
                    <option value="GRADING">Operator Grading</option>
                    <option value="TIMBANGAN">Operator Timbangan</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                {/* Status Update */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Update Status (Opsional)
                  </label>
                  <select
                    value={updateForm.isActive}
                    onChange={(e) => setUpdateForm({ ...updateForm, isActive: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Tidak mengubah status --</option>
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>

                {/* Force Password Change */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="forcePasswordChange"
                    checked={updateForm.forcePasswordChange}
                    onChange={(e) => setUpdateForm({ ...updateForm, forcePasswordChange: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="forcePasswordChange" className="ml-2 text-sm text-gray-300">
                    Paksa pengguna untuk mengganti password pada login berikutnya
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  onClick={resetForm}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Reset Form
                </button>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>Update {selectedCount} Pengguna</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h3 className="text-white font-medium mb-1">Peringatan Penghapusan</h3>
                    <p className="text-gray-400 text-sm mb-2">
                      Anda akan menghapus {selectedCount} pengguna secara permanen.
                      Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <p className="text-gray-500 text-sm">
                      • Admin users tidak akan dihapus untuk keamanan sistem<br/>
                      • Pengguna yang dihapus akan dinonaktifkan (soft delete)
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus {selectedCount} Pengguna</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkOperations