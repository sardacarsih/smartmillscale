import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Initial state for PKS reporting
const initialState = {
  // Report data state
  reportData: null,
  reportSummary: null,
  transactions: [],
  trends: null,
  anomalies: null,

  // Loading states
  isLoading: false,
  isGenerating: false,
  isExporting: false,

  // UI state
  activeTab: 'summary', // 'summary', 'details', 'trends', 'anomalies'
  selectedTransactionIds: [],

  // Filters state
  filters: {
    startDate: null,
    endDate: null,
    reportType: 'custom', // 'today', 'thisWeek', 'thisMonth', 'custom'
    supplierIds: [],
    productIds: [],
    statusFilter: 'all', // 'all', 'completed', 'rejected'
    gradeFilter: [], // ['A', 'B', 'C', 'D']
  },

  // Available filter options
  filterOptions: {
    suppliers: [],
    products: [],
    grades: [],
    statuses: [],
  },

  // Date presets
  datePresets: [],

  // Export progress
  exportProgress: {
    status: 'idle', // 'idle', 'started', 'completed', 'error'
    message: '',
    size: 0,
  },

  // Validation state
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
  },

  // Error handling
  error: null,
  errorDetails: null,

  // Pagination for large datasets
  pagination: {
    page: 1,
    pageSize: 50,
    totalRecords: 0,
    totalPages: 0,
  },

  // Search and sorting
  searchQuery: '',
  sortBy: 'timbang1_date',
  sortOrder: 'desc', // 'asc', 'desc'
}

const useReportStore = create(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Actions

    // Set loading state
    setLoading: (loading) => set({ isLoading: loading }),

    // Set generating state
    setGenerating: (generating) => set({ isGenerating: generating }),

    // Set exporting state
    setExporting: (exporting) => set({ isExporting: exporting }),

    // Set active tab
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Error handling
    setError: (error, details = null) => set({ error, errorDetails: details }),
    clearError: () => set({ error: null, errorDetails: null }),

    // Set report data
    setReportData: (data) => set({
      reportData: data,
      reportSummary: data?.summary || null,
      transactions: data?.transactions || [],
      trends: data?.trends || null,
      anomalies: data?.anomalies || null,
    }),

    // Set report summary only
    setReportSummary: (summary) => set({ reportSummary: summary }),

    // Update filters
    updateFilters: (filterUpdates) => set((state) => ({
      filters: { ...state.filters, ...filterUpdates }
    })),

    // Reset filters
    resetFilters: () => set({
      filters: {
        startDate: null,
        endDate: null,
        reportType: 'custom',
        supplierIds: [],
        productIds: [],
        statusFilter: 'all',
        gradeFilter: [],
      }
    }),

    // Set filter options
    setFilterOptions: (options) => set({ filterOptions: options }),

    // Set date presets
    setDatePresets: (presets) => set({ datePresets: presets }),

    // Apply date preset
    applyDatePreset: (presetKey) => {
      const { datePresets } = get()
      const preset = datePresets.find(p => p.key === presetKey)
      if (preset) {
        set((state) => ({
          filters: {
            ...state.filters,
            startDate: preset.startDate,
            endDate: preset.endDate,
            reportType: presetKey
          }
        }))
      }
    },

    // Set export progress
    setExportProgress: (progress) => set({ exportProgress: progress }),

    // Set validation results
    setValidation: (validation) => set({ validation }),

    // Transaction selection
    toggleTransactionSelection: (transactionId) => {
      set((state) => {
        const isSelected = state.selectedTransactionIds.includes(transactionId)
        const selectedTransactionIds = isSelected
          ? state.selectedTransactionIds.filter(id => id !== transactionId)
          : [...state.selectedTransactionIds, transactionId]
        return { selectedTransactionIds }
      })
    },

    selectAllTransactions: () => {
      const { transactions } = get()
      const allIds = transactions.map(t => t.noTransaksi)
      set({ selectedTransactionIds: allIds })
    },

    clearTransactionSelection: () => set({ selectedTransactionIds: [] }),

    // Search and sorting
    setSearchQuery: (query) => set({ searchQuery: query }),

    setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

    // Pagination
    setPagination: (pagination) => set({ pagination }),

    // Report generation actions
    generateReport: async (reportService, request) => {
      const state = get()

      // Validate request first
      try {
        set({ isGenerating: true, error: null })

        // Validate the request
        const validation = await reportService.ValidatePKSReportRequest(request)
        set({ validation })

        if (!validation.isValid) {
          throw new Error('Request validation failed: ' + validation.errors.join(', '))
        }

        // Generate the report
        console.log('📊 [useReportStore] Generating report for:', request)
        const reportData = await reportService.GeneratePKSReport(request)

        set({
          reportData,
          reportSummary: reportData.summary,
          transactions: reportData.transactions,
          trends: reportData.trends,
          anomalies: reportData.anomalies,
          pagination: {
            ...state.pagination,
            totalRecords: reportData.metadata.totalRecords,
            totalPages: Math.ceil(reportData.metadata.totalRecords / state.pagination.pageSize),
          }
        })

        console.log('✅ [useReportStore] Report generated successfully')
        return reportData

      } catch (error) {
        console.error('❌ [useReportStore] Failed to generate report:', error)
        set({
          error: error.message || 'Failed to generate report',
          errorDetails: error,
          isGenerating: false
        })
        throw error
      } finally {
        set({ isGenerating: false })
      }
    },

    generateReportSummary: async (reportService, request) => {
      try {
        set({ isLoading: true, error: null })

        console.log('📊 [useReportStore] Generating report summary for:', request)
        const summary = await reportService.GetPKSReportSummary(request)

        set({ reportSummary: summary })

        console.log('✅ [useReportStore] Report summary generated successfully')
        return summary

      } catch (error) {
        console.error('❌ [useReportStore] Failed to generate report summary:', error)
        set({
          error: error.message || 'Failed to generate report summary',
          errorDetails: error
        })
        throw error
      } finally {
        set({ isLoading: false })
      }
    },

    // Export actions
    exportToCSV: async (reportService, request, filename = null) => {
      try {
        set({ isExporting: true, error: null })

        console.log('📄 [useReportStore] Exporting to CSV:', request)
        const csvData = await reportService.ExportPKSReportToCSV(request)

        // Create download
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        const defaultFilename = `PKS-Report-${new Date().toISOString().split('T')[0]}.csv`
        link.setAttribute('href', url)
        link.setAttribute('download', filename || defaultFilename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        console.log('✅ [useReportStore] CSV export completed successfully')

      } catch (error) {
        console.error('❌ [useReportStore] Failed to export to CSV:', error)
        set({
          error: error.message || 'Failed to export to CSV',
          errorDetails: error
        })
        throw error
      } finally {
        set({ isExporting: false })
      }
    },

    exportToExcel: async (reportService, request, filename = null) => {
      try {
        set({ isExporting: true, error: null })

        console.log('📊 [useReportStore] Exporting to Excel:', request)

        // Listen for progress events
        const handleProgress = (event) => {
          const { progress } = event.detail
          set({ exportProgress: progress })
        }
        window.addEventListener('export_progress', handleProgress)

        const excelBytes = await reportService.ExportPKSReportToExcel(request)

        // Convert base64 to blob
        const blob = new Blob([excelBytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        // Create download
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        const defaultFilename = `PKS-Report-${new Date().toISOString().split('T')[0]}.xlsx`
        link.setAttribute('href', url)
        link.setAttribute('download', filename || defaultFilename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Clean up event listener
        window.removeEventListener('export_progress', handleProgress)

        console.log('✅ [useReportStore] Excel export completed successfully')

      } catch (error) {
        console.error('❌ [useReportStore] Failed to export to Excel:', error)
        set({
          error: error.message || 'Failed to export to Excel',
          errorDetails: error
        })
        throw error
      } finally {
        set({ isExporting: false, exportProgress: initialState.exportProgress })
      }
    },

    // Load filter options
    loadFilterOptions: async (reportService) => {
      try {
        set({ isLoading: true, error: null })

        console.log('🔍 [useReportStore] Loading filter options')
        const filterOptions = await reportService.GetPKSReportFilters()
        set({ filterOptions })

        console.log('✅ [useReportStore] Filter options loaded successfully')
        return filterOptions

      } catch (error) {
        console.error('❌ [useReportStore] Failed to load filter options:', error)
        set({
          error: error.message || 'Failed to load filter options',
          errorDetails: error
        })
        throw error
      } finally {
        set({ isLoading: false })
      }
    },

    // Load date presets
    loadDatePresets: async (reportService) => {
      try {
        set({ isLoading: true, error: null })

        console.log('📅 [useReportStore] Loading date presets')
        const datePresets = await reportService.GetPKSReportDatePresets()
        set({ datePresets })

        console.log('✅ [useReportStore] Date presets loaded successfully')
        return datePresets

      } catch (error) {
        console.error('❌ [useReportStore] Failed to load date presets:', error)
        set({
          error: error.message || 'Failed to load date presets',
          errorDetails: error
        })
        throw error
      } finally {
        set({ isLoading: false })
      }
    },

    // Reset state
    resetState: () => set(initialState),

    // Utility methods
    getFilteredTransactions: () => {
      const { transactions, searchQuery } = get()

      if (!searchQuery) return transactions

      const query = searchQuery.toLowerCase()
      return transactions.filter(transaction =>
        transaction.noTransaksi.toLowerCase().includes(query) ||
        transaction.nomorKendaraan.toLowerCase().includes(query) ||
        transaction.supplierName.toLowerCase().includes(query) ||
        transaction.productName.toLowerCase().includes(query) ||
        transaction.grade.toLowerCase().includes(query)
      )
    },

    getSelectedTransactions: () => {
      const { transactions, selectedTransactionIds } = get()
      return transactions.filter(t => selectedTransactionIds.includes(t.noTransaksi))
    },

    getValidationErrors: () => {
      const { validation } = get()
      return validation.errors || []
    },

    getValidationWarnings: () => {
      const { validation } = get()
      return validation.warnings || []
    },
  }))
)

export { useReportStore }