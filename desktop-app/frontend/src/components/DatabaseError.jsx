import React from 'react'
import { AlertTriangle, Database, RefreshCw, Settings } from 'lucide-react'

const DatabaseError = ({ onRetry, error }) => {
  const handleRetry = () => {
    window.location.reload()
  }

  const handleOpenSettings = () => {
    // Could open a settings modal or navigate to settings page
    alert('Silakan periksa konfigurasi database di file konfigurasi aplikasi')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Database Tidak Tersedia
          </h1>
          <p className="text-gray-400 text-lg">
            Aplikasi tidak dapat terhubung ke database SQLite
          </p>
        </div>

        {/* Error Details */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium mb-1">Detail Error:</h3>
                <p className="text-gray-300 text-sm font-mono bg-black/30 p-2 rounded">
                  {error.message || error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What this means */}
        <div className="bg-gray-700/30 rounded-lg p-6 mb-6">
          <h3 className="text-white font-medium mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
            Apa artinya error ini?
          </h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-red-400 mr-2">•</span>
              Aplikasi memerlukan database SQLite untuk berfungsi
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2">•</span>
              Tidak ada fallback autentikasi yang tersedia
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2">•</span>
              Data pengguna dan operasi memerlukan database
            </li>
          </ul>
        </div>

        {/* Solutions */}
        <div className="bg-gray-700/30 rounded-lg p-6 mb-6">
          <h3 className="text-white font-medium mb-3 flex items-center">
            <Settings className="w-5 h-5 text-blue-400 mr-2" />
            Solusi yang mungkin:
          </h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Pastikan aplikasi dijalankan melalui <code className="bg-gray-600 px-1 rounded">wails dev</code>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Periksa izin akses folder <code className="bg-gray-600 px-1 rounded">./data/</code>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Pastikan tidak ada aplikasi lain yang mengunci database
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Coba hapus file database lama untuk membuat ulang
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
          <button
            onClick={handleOpenSettings}
            className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Bantuan</span>
          </button>
        </div>

        {/* Debug Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Database Path: ./data/smartmillscale.db
          </p>
          <p className="text-gray-500 text-xs">
            Required: SQLite Database with Authentication
          </p>
        </div>
      </div>
    </div>
  )
}

export default DatabaseError
