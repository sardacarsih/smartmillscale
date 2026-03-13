import { create } from 'zustand'

/**
 * Cache Configuration
 */
const CACHE_KEY = 'pks_master_data_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Cache Helper Functions
 */
const cacheHelpers = {
  // Get cached master data
  get: () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const parsed = JSON.parse(cached)
      return parsed
    } catch (error) {
      console.warn('Failed to read master data cache:', error)
      return null
    }
  },

  // Set master data cache
  set: (data) => {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data
      }
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      console.log('✅ Master data cached successfully')
    } catch (error) {
      console.warn('Failed to cache master data:', error)
    }
  },

  // Check if cache is still valid
  isValid: () => {
    const cached = cacheHelpers.get()
    if (!cached || !cached.timestamp) return false

    const age = Date.now() - cached.timestamp
    const isValid = age < CACHE_TTL

    if (!isValid) {
      console.log('⏰ Master data cache expired')
    }

    return isValid
  },

  // Clear cache
  clear: () => {
    try {
      sessionStorage.removeItem(CACHE_KEY)
      console.log('🗑️ Master data cache cleared')
    } catch (error) {
      console.warn('Failed to clear master data cache:', error)
    }
  }
}

/**
 * usePKSStore - Zustand store for PKS/Timbangan state management
 * 
 * REFACTORED to use Service Layer pattern:
 * - Store only manages STATE, not API calls
 * - All async methods accept PKSService as parameter
 * - Better testability and separation of concerns
 * 
 * OPTIMIZED with caching:
 * - Master data cached in sessionStorage (5-min TTL)
 * - Reduces API calls on subsequent page visits
 * - Statistics and pending lists loaded on-demand
 */
const usePKSStore = create((set, get) => ({
  // Master data state
  masterData: {
    products: [],
    units: [],
    suppliers: [],
    estates: [],
    afdelings: [],
    blocks: [] // Blocks already contain afdeling and estate information
  },
  loadingMasterData: false,
  masterDataError: null,

  // Current transaction state
  currentTransaction: null,
  transactionForm: {
    noTransaksi: '',
    idProduk: '',
    idUnit: '',
    idSupplier: '',
    driverName: '',
    idEstate: '',
    idAfdeling: '',
    idBlok: '',
    sumberTBS: '',
    janjang: '',
    grade: '',
    tbsBlocks: [], // Array of { blok: 'A', janjang: 0, berat: 0 }
    bruto: 0,
    tara: 0,
    netto: 0,
    bruto2: 0,
    tara2: 0,
    netto2: 0,
    mode: 'timbang1', // 'timbang1' | 'timbang2'
  },

  // Pending transactions state
  pendingTimbang2: [],
  pendingCompletion: [],
  loadingPending: false,
  pendingError: null,

  // UI state
  activeTab: 'timbang2', // 'timbang2', 'pending', 'ticket'
  isSubmitting: false,
  notification: null,
  showTBSBlockModal: false,
  searchQuery: '',
  searchFilters: {
    status: '',
    idProduk: '',
    idUnit: '',
    dateRange: { start: null, end: null }
  },

  // Statistics state
  statistics: {
    totalTransactions: 0,
    timbang1Count: 0,
    timbang2Count: 0,
    completedCount: 0,
    totalWeight: 0,
    todayTransactions: 0
  },
  loadingStatistics: false,

  // Master data actions
  fetchMasterData: async (masterDataService) => {
    set({ loadingMasterData: true, masterDataError: null })
    try {
      if (!masterDataService) {
        throw new Error('MasterDataService is required')
      }

      // Fetch all master data needed for the form
      console.log('🔍 [PKS Store] Fetching master data...')
      console.log('  - masterDataService:', masterDataService)
      console.log('  - Has getProducts:', typeof masterDataService?.getProducts)

      const [productsRes, unitsRes, suppliersRes, estatesRes, afdelingsRes, blocksRes] = await Promise.all([
        masterDataService.getProducts(true),
        masterDataService.getUnits(true),
        masterDataService.getSuppliers(true),
        masterDataService.getEstates(true),
        masterDataService.getAfdelings(true),
        masterDataService.getBloks(true) // Fetch all blocks
      ])

      console.log('✅ [PKS Store] Raw API responses received')
      console.log('  - Products:', productsRes)
      console.log('  - Units:', unitsRes)
      console.log('  - Suppliers:', suppliersRes)
      console.log('  - Estates:', estatesRes)
      console.log('  - Afdelings:', afdelingsRes)
      console.log('  - Blocks:', blocksRes)

      // Backend returns data directly, not wrapped in response objects
      const masterData = {
        products: Array.isArray(productsRes) ? productsRes : [],
        units: Array.isArray(unitsRes) ? unitsRes : [],
        suppliers: Array.isArray(suppliersRes) ? suppliersRes : [],
        estates: Array.isArray(estatesRes) ? estatesRes : [],
        afdelings: Array.isArray(afdelingsRes) ? afdelingsRes : [],
        blocks: Array.isArray(blocksRes) ? blocksRes : []
      }

      console.log('📊 [PKS Store] Processed master data:', {
        products: masterData.products.length,
        units: masterData.units.length,
        suppliers: masterData.suppliers.length,
        estates: masterData.estates.length,
        afdelings: masterData.afdelings.length,
        blocks: masterData.blocks.length
      })

      set({
        masterData,
        loadingMasterData: false
      })

      return masterData
    } catch (error) {
      console.error('❌ [PKS Store] Failed to fetch master data')
      console.error('  - Error type:', error.constructor.name)
      console.error('  - Error message:', error.message)
      console.error('  - Error stack:', error.stack)

      set({
        masterDataError: error.message,
        loadingMasterData: false
      })
      throw error
    }
  },

  // Fetch master data with caching (optimized version)
  fetchMasterDataWithCache: async (masterDataService, forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && cacheHelpers.isValid()) {
      const cached = cacheHelpers.get()
      if (cached && cached.data) {
        console.log('📦 Using cached master data:', {
          timestamp: new Date(cached.timestamp).toISOString(),
          age: Math.round((Date.now() - cached.timestamp) / 1000) + 's',
          products: cached.data.products?.length || 0,
          units: cached.data.units?.length || 0,
          suppliers: cached.data.suppliers?.length || 0,
          estates: cached.data.estates?.length || 0,
          afdelings: cached.data.afdelings?.length || 0,
          blocks: cached.data.blocks?.length || 0
        })
        set({
          masterData: cached.data,
          loadingMasterData: false,
          masterDataError: null
        })
        return cached.data
      }
    }

    // Cache miss or expired - fetch from API
    console.log('🌐 Fetching fresh master data from API')
    set({ loadingMasterData: true, masterDataError: null })

    try {
      const masterData = await get().fetchMasterData(masterDataService)

      // Cache the fresh data
      cacheHelpers.set(masterData)

      return masterData
    } catch (error) {
      console.error('❌ [PKS Store] Fetch failed, clearing potentially corrupted cache')
      cacheHelpers.clear() // Clear cache to prevent persistent failures

      set({
        masterDataError: error.message,
        loadingMasterData: false
      })
      throw error
    }
  },

  // Clear master data cache (call this when master data is updated)
  clearMasterDataCache: () => {
    cacheHelpers.clear()
  },



  // Transaction form actions
  updateTransactionForm: (field, value) => {
    set(state => ({
      transactionForm: {
        ...state.transactionForm,
        [field]: value
      }
    }))

    // Auto-calculate netto when bruto or tara changes
    if (field === 'bruto' || field === 'tara') {
      const { bruto, tara } = get().transactionForm
      const netto = Math.max(0, bruto - tara)
      set(state => ({
        transactionForm: {
          ...state.transactionForm,
          netto
        }
      }))
    }

    // Auto-calculate netto2 when bruto2 or tara2 changes
    if (field === 'bruto2' || field === 'tara2') {
      const { bruto2, tara2 } = get().transactionForm
      const netto2 = Math.max(0, bruto2 - tara2)
      set(state => ({
        transactionForm: {
          ...state.transactionForm,
          netto2
        }
      }))
    }

    // Clear dependent fields when product changes
    if (field === 'idProduk') {
      set(state => ({
        transactionForm: {
          ...state.transactionForm,
          idBlok: ''
        }
      }))
    }

    // Clear blok when it changes
    if (field === 'idBlok') {
      // No nested dependencies
    }
  },

  resetTransactionForm: () => {
    set({
      transactionForm: {
        noTransaksi: '',
        idProduk: '',
        idUnit: '',
        driverName: '',
        idSupplier: '',
        idBlok: '',
        sumberTBS: '',
        janjang: '',
        grade: '',
        tbsBlocks: [],
        bruto: 0,
        tara: 0,
        netto: 0,
        bruto2: 0,
        tara2: 0,
        netto2: 0,
        mode: 'timbang1'
      },
      currentTransaction: null
    })
  },

  // Transaction actions
  createTimbang1: async (pksService, userId) => {
    set({ isSubmitting: true, notification: null })
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      const { transactionForm } = get()

      const transaction = await pksService.createTimbang1(transactionForm, userId)
      set({
        currentTransaction: transaction,
        isSubmitting: false,
        notification: {
          type: 'success',
          message: `Transaksi ${transaction.noTransaksi} berhasil dibuat!`
        }
      })

      // Refresh pending lists
      get().fetchPendingTimbang2(pksService)
      get().fetchStatistics(pksService)

      return transaction
    } catch (error) {
      set({
        isSubmitting: false,
        notification: {
          type: 'error',
          message: `Gagal membuat transaksi: ${error.message || error || 'Terjadi kesalahan yang tidak diketahui'}`
        }
      })
      return null
    }
  },

  updateTimbang2: async (pksService, userId) => {
    set({ isSubmitting: true, notification: null })
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      const { transactionForm, currentTransaction } = get()
      const updateData = {
        noTransaksi: currentTransaction.noTransaksi,
        bruto2: transactionForm.bruto2 || 0,
        tara2: transactionForm.tara2 || 0,
        netto2: transactionForm.netto2 || 0
      }

      const transaction = await pksService.updateTimbang2(updateData, userId)
      set({
        currentTransaction: transaction,
        isSubmitting: false,
        notification: {
          type: 'success',
          message: `Timbang 2 untuk ${transaction.noTransaksi} berhasil!`
        }
      })

      // Refresh pending lists
      get().fetchPendingTimbang2(pksService)
      get().fetchPendingCompletion(pksService)
      get().fetchStatistics(pksService)

      return transaction
    } catch (error) {
      set({
        isSubmitting: false,
        notification: {
          type: 'error',
          message: `Gagal update timbang 2: ${error.message}`
        }
      })
      return null
    }
  },

  completeTransaction: async (pksService, userId) => {
    set({ isSubmitting: true, notification: null })
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      const { currentTransaction } = get()
      const transaction = await pksService.completeTransaction(currentTransaction.noTransaksi, userId)

      set({
        currentTransaction: transaction,
        isSubmitting: false,
        notification: {
          type: 'success',
          message: `Transaksi ${transaction.noTransaksi} selesai!`
        }
      })

      // Refresh pending lists and statistics
      get().fetchPendingCompletion(pksService)
      get().fetchStatistics(pksService)

      // Auto-reset to Timbang1 mode after 2 seconds
      setTimeout(() => {
        get().resetTransactionForm()
      }, 2000)

      return transaction
    } catch (error) {
      set({
        isSubmitting: false,
        notification: {
          type: 'error',
          message: `Gagal menyelesaikan transaksi: ${error.message}`
        }
      })
      return null
    }
  },

  // Pending transactions actions
  fetchPendingTimbang2: async (pksService) => {
    set({ loadingPending: true, pendingError: null })
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      const transactions = await pksService.getPendingTimbang2(50)
      set({
        pendingTimbang2: transactions,
        loadingPending: false
      })
    } catch (error) {
      set({
        pendingError: error.message,
        loadingPending: false
      })
    }
  },

  fetchPendingCompletion: async (pksService) => {
    set({ loadingPending: true, pendingError: null })
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      const transactions = await pksService.getPendingCompletion(50)
      set({
        pendingCompletion: transactions,
        loadingPending: false
      })
    } catch (error) {
      set({
        pendingError: error.message,
        loadingPending: false
      })
    }
  },

  // Statistics actions
  fetchStatistics: async (pksService, days = 30) => {
    set({ loadingStatistics: true })
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      const stats = await pksService.getStatistics(days)
      set({
        statistics: stats,
        loadingStatistics: false
      })
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
      set({ loadingStatistics: false })
    }
  },

  // Transaction search and management
  searchTransactions: async (pksService, filters) => {
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      return await pksService.searchTransactions(filters)
    } catch (error) {
      console.error('Failed to search transactions:', error)
      return null
    }
  },

  getTransactionByNoTransaksi: async (pksService, noTransaksi) => {
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      return await pksService.getTransactionByNoTransaksi(noTransaksi)
    } catch (error) {
      console.error('Failed to get transaction:', error)
      return null
    }
  },

  loadTransactionForTimbang2: async (pksService, noTransaksi) => {
    const transaction = await get().getTransactionByNoTransaksi(pksService, noTransaksi)
    if (transaction) {
      set({
        currentTransaction: transaction,
        transactionForm: {
          ...get().transactionForm,
          noTransaksi: transaction.noTransaksi,
          bruto2: transaction.bruto2 || 0,
          tara2: transaction.tara2 || 0,
          netto2: transaction.netto2 || 0
        },
        activeTab: 'timbang2'
      })
    }
    return transaction
  },

  loadTransactionForCompletion: async (pksService, noTransaksi) => {
    const transaction = await get().getTransactionByNoTransaksi(pksService, noTransaksi)
    if (transaction) {
      set({
        currentTransaction: transaction,
        activeTab: 'timbang2'
      })
    }
    return transaction
  },

  // UI actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  setNotification: (notification) => set({ notification }),

  clearNotification: () => set({ notification: null }),

  setMode: (mode) => {
    set(state => ({
      transactionForm: {
        ...state.transactionForm,
        mode
      }
    }))
  },

  // TBS Block modal actions
  openTBSBlockModal: () => set({ showTBSBlockModal: true }),
  hideTBSBlockModal: () => set({ showTBSBlockModal: false }),

  setTBSBlocks: (blocks) => {
    set(state => ({
      transactionForm: {
        ...state.transactionForm,
        tbsBlocks: blocks
      }
    }))
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  updateSearchFilters: (filters) => set(state => ({
    searchFilters: {
      ...state.searchFilters,
      ...filters
    }
  })),

  // Ticket printing actions
  printTicket: async (pksService, timbanganId, copies = 1, userId) => {
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      const response = await pksService.printTicket(timbanganId, copies, userId)

      if (response.success) {
        set({
          notification: {
            type: 'success',
            message: `Tiket ${response.ticketNumber} berhasil dicetak!`
          }
        })
      } else {
        set({
          notification: {
            type: 'error',
            message: response.errorMessage || 'Gagal mencetak tiket'
          }
        })
      }

      return response
    } catch (error) {
      set({
        notification: {
          type: 'error',
          message: `Gagal mencetak tiket: ${error.message}`
        }
      })
      return null
    }
  },

  reprintTicket: async (pksService, timbanganId, userId) => {
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      const response = await pksService.reprintTicket(timbanganId, userId)

      if (response.success) {
        set({
          notification: {
            type: 'success',
            message: `Tiket ${response.ticketNumber} berhasil di-reprint!`
          }
        })
      } else {
        set({
          notification: {
            type: 'error',
            message: response.errorMessage || 'Gagal reprint tiket'
          }
        })
      }

      return response
    } catch (error) {
      set({
        notification: {
          type: 'error',
          message: `Gagal reprint tiket: ${error.message}`
        }
      })
      return null
    }
  },

  getTicketHistory: async (pksService, limit = 10, offset = 0) => {
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      return await pksService.getTicketHistory(limit, offset)
    } catch (error) {
      console.error('Failed to get ticket history:', error)
      return null
    }
  },

  getPrintStatistics: async (pksService, days = 30) => {
    try {
      if (!pksService) {
        throw new Error('PKSService is required')
      }
      return await pksService.getPrintStatistics(days)
    } catch (error) {
      console.error('Failed to get print statistics:', error)
      return null
    }
  },

  // Initialize store (OPTIMIZED VERSION)
  // Only loads master data with caching
  // Statistics and pending lists are loaded on-demand
  initialize: async (pksService, masterDataService) => {
    if (!pksService || !masterDataService) {
      throw new Error('PKSService and MasterDataService are required for initialization')
    }

    // Only fetch master data with cache - much faster!
    await get().fetchMasterDataWithCache(masterDataService)

    console.log('✅ PKS Store initialized with cached master data')
    // Note: Statistics and pending lists will be loaded when needed
  },

  // Helper to load all transaction data (for use in specific views)
  loadTransactionData: async (pksService) => {
    if (!pksService) {
      throw new Error('PKSService is required')
    }

    await Promise.all([
      get().fetchPendingTimbang2(pksService),
      get().fetchPendingCompletion(pksService),
      get().fetchStatistics(pksService)
    ])

    console.log('✅ Transaction data loaded')
  }
}))

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: PKS store reloaded')
  })
}

// Export cache helpers for use in master data components
export const clearPKSMasterDataCache = () => {
  cacheHelpers.clear()
}

export default usePKSStore