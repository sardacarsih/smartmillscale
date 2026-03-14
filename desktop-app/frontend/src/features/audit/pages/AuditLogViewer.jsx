import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, User, Shield, Activity, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageShell } from '../../../shared'

// Initialize Wails bindings if available
function initializeWailsBindings() {
  // Check if Wails is available and bindings exist
  if (window.Go && window.Go.main && window.Go.main.App) {
    return window.Go.main.App
  }

  // Fall back to mock functions for development
  console.warn('Wails bindings not available, using mock functions')
  return {
    GetAuditLogs: async (offset, limit) => ({
      logs: [
        {
          id: '1',
          userId: '1',
          username: 'admin',
          action: 'LOGIN_SUCCESS',
          entityType: '',
          entityId: null,
          details: 'User logged in successfully',
          ipAddress: 'localhost',
          success: true,
          errorMsg: null,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          userId: '1',
          username: 'admin',
          action: 'USER_CREATED',
          entityType: 'user',
          entityId: '2',
          details: 'Created new user: testuser',
          ipAddress: 'localhost',
          success: true,
          errorMsg: null,
          timestamp: new Date().toISOString()
        }
      ],
      total: 2,
      offset,
      limit
    })
  }
}

const AuditLogViewer = ({ currentUser, wails: wailsProp, onNavigate, onLogout }) => {
  const wails = wailsProp || initializeWailsBindings()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedSuccess, setSelectedSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [pageSize] = useState(20)
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Action types for filtering
  const actionTypes = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'LOGOUT',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'PASSWORD_CHANGED',
    'PASSWORD_RESET',
    'WEIGHING_RECORDED',
    'SYNC_STARTED',
    'SYNC_COMPLETED',
    'SYNC_FAILED',
    'CONFIG_UPDATED'
  ]

  // Load audit logs on component mount and when filters change
  useEffect(() => {
    loadLogs()
  }, [currentPage, selectedAction, selectedSuccess, dateRange])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * pageSize

      const result = await wails.GetAuditLogs(offset, pageSize)

      if (result && result.logs) {
        setLogs(result.logs)
        setTotalLogs(result.total || 0)
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      setLogs([])
      setTotalLogs(0)
    } finally {
      setLoading(false)
    }
  }

  // Filter logs based on search term and filters
  const getFilteredLogs = () => {
    let filtered = logs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.errorMsg?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Action filter
    if (selectedAction) {
      filtered = filtered.filter(log => log.action === selectedAction)
    }

    // Success filter
    if (selectedSuccess !== '') {
      const isSuccess = selectedSuccess === 'true'
      filtered = filtered.filter(log => log.success === isSuccess)
    }

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate)
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end + 'T23:59:59')
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate)
    }

    return filtered
  }

  const getStatusIcon = (success) => {
    if (success) {
      return <CheckCircle className="w-5 h-5 text-green-400" />
    } else {
      return <XCircle className="w-5 h-5 text-red-400" />
    }
  }

  const getActionIcon = (action) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return <User className="w-4 h-4 text-blue-400" />
    } else if (action.includes('USER') || action.includes('PASSWORD')) {
      return <Shield className="w-4 h-4 text-purple-400" />
    } else if (action.includes('WEIGHING')) {
      return <Activity className="w-4 h-4 text-green-400" />
    } else if (action.includes('SYNC') || action.includes('CONFIG')) {
      return <AlertCircle className="w-4 h-4 text-yellow-400" />
    } else {
      return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionLabel = (action) => {
    const labels = {
      'LOGIN_SUCCESS': 'Login Berhasil',
      'LOGIN_FAILED': 'Login Gagal',
      'LOGOUT': 'Logout',
      'USER_CREATED': 'Pengguna Dibuat',
      'USER_UPDATED': 'Pengguna Diubah',
      'USER_DELETED': 'Pengguna Dihapus',
      'PASSWORD_CHANGED': 'Password Diubah',
      'PASSWORD_RESET': 'Password Di-Reset',
      'WEIGHING_RECORDED': 'Penimbangan Dicatat',
      'SYNC_STARTED': 'Sinkronisasi Dimulai',
      'SYNC_COMPLETED': 'Sinkronisasi Selesai',
      'SYNC_FAILED': 'Sinkronisasi Gagal',
      'CONFIG_UPDATED': 'Konfigurasi Diubah'
    }
    return labels[action] || action
  }

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      return timestamp
    }
  }

  const totalPages = Math.ceil(totalLogs / pageSize)
  const filteredLogs = getFilteredLogs()

  return (
    <PageShell
      title="Smart Mill Scale"
      subtitle="Audit Log"
      currentUser={currentUser}
      onLogout={onLogout}
      onNavigate={onNavigate}
      pageTitle="Riwayat Audit"
      pageDescription="Riwayat aktivitas dan kejadian sistem dengan filter dan tabel yang tetap dapat digunakan pada resolusi laptop."
      contentWidth="wide"
    >
      <div className="space-y-6">
        <div className="mb-8">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari audit log..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              <Filter className="w-5 h-5" />
              <span>Filter</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                showFilters ? 'rotate-180' : ''
              }`} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-400">
              <Activity className="w-4 h-4" />
              <span>Total: {totalLogs}</span>
            </div>
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>Sukses: {logs.filter(l => l.success).length}</span>
            </div>
            <div className="flex items-center space-x-2 text-red-400">
              <XCircle className="w-4 h-4" />
              <span>Gagal: {logs.filter(l => !l.success).length}</span>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Aksi
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Aksi</option>
                  {actionTypes.map(action => (
                    <option key={action} value={action}>
                      {getActionLabel(action)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={selectedSuccess}
                  onChange={(e) => setSelectedSuccess(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Status</option>
                  <option value="true">Sukses</option>
                  <option value="false">Gagal</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rentang Tanggal
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedAction('')
                  setSelectedSuccess('')
                  setDateRange({ start: '', end: '' })
                  setSearchTerm('')
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                Hapus Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Memuat audit log...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Aksi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                        {searchTerm || selectedAction || selectedSuccess !== '' || dateRange.start || dateRange.end
                          ? 'Tidak ada audit log yang cocok dengan filter'
                          : 'Belum ada audit log'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-300" />
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">
                                {log.username || 'System'}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {log.ipAddress}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getActionIcon(log.action)}
                            <span className="text-white text-sm">
                              {getActionLabel(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusIcon(log.success)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            {log.details && (
                              <div className="text-gray-300 text-sm mb-1">
                                {log.details}
                              </div>
                            )}
                            {log.errorMsg && (
                              <div className="text-red-400 text-sm">
                                {log.errorMsg}
                              </div>
                            )}
                            {log.entityType && (
                              <div className="text-gray-500 text-xs">
                                Entity: {log.entityType}
                                {log.entityId && ` (${log.entityId.slice(0, 8)}...)`}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 bg-gray-700/30 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-gray-400 text-sm">
                  Menampilkan {filteredLogs.length} dari {totalLogs} log
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-gray-300">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </PageShell>
  )
}

export default AuditLogViewer
