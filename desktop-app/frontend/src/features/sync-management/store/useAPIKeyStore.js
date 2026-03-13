import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const useAPIKeyStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    apiKeys: [],
    selectedAPIKey: null,

    // UI State
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isActivating: false,

    // Error and success states
    error: null,
    successMessage: null,

    // Modal states
    showCreateModal: false,
    showEditModal: false,
    showDeleteModal: false,

    // Form data
    formData: {
      name: '',
      description: '',
      apiKey: '',
      serverUrl: ''
    },

    // Validation errors
    validationErrors: {},

    // Search and filter
    searchQuery: '',
    filterStatus: 'all', // 'all', 'active', 'inactive'

    // Pagination
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    },

    // Actions

    // Set loading states
    setLoading: (loading) => set({ isLoading: loading }),
    setCreating: (creating) => set({ isCreating: creating }),
    setUpdating: (updating) => set({ isUpdating: updating }),
    setDeleting: (deleting) => set({ isDeleting: deleting }),
    setActivating: (activating) => set({ isActivating: activating }),

    // Set error and success messages
    setError: (error) => set({ error, successMessage: null }),
    setSuccessMessage: (message) => set({ successMessage: message, error: null }),
    clearMessages: () => set({ error: null, successMessage: null }),

    // Modal controls
    showCreateDialog: () => set({
      showCreateModal: true,
      formData: { name: '', description: '', apiKey: '', serverUrl: '' },
      validationErrors: {}
    }),
    hideCreateDialog: () => set({ showCreateModal: false }),

    showEditDialog: (apiKey) => set({
      showEditModal: true,
      selectedAPIKey: apiKey,
      formData: {
        name: apiKey.name || '',
        description: apiKey.description || '',
        apiKey: '', // Don't pre-fill API key for security
        serverUrl: apiKey.serverUrl || ''
      },
      validationErrors: {}
    }),
    hideEditDialog: () => set({ showEditModal: false, selectedAPIKey: null }),

    showDeleteDialog: (apiKey) => set({
      showDeleteModal: true,
      selectedAPIKey: apiKey
    }),
    hideDeleteDialog: () => set({ showDeleteModal: false, selectedAPIKey: null }),

    // Form management
    updateFormData: (field, value) => set((state) => {
      console.log('🔧 [updateFormData] Updating field:', field, 'with value:', value)
      const newFormData = {
        ...state.formData,
        [field]: value
      }
      console.log('🔧 [updateFormData] New form data:', newFormData)
      return {
        formData: newFormData
      }
    }),

    resetFormData: () => set({
      formData: {
        name: '',
        description: '',
        apiKey: '',
        serverUrl: ''
      },
      validationErrors: {}
    }),

    // Validation
    setValidationErrors: (errors) => set({ validationErrors: errors }),
    clearValidationErrors: () => set({ validationErrors: {} }),

    // Validate form
    validateForm: (isEdit = false) => {
      const state = get()
      const { formData } = state
      const errors = {}

      console.log('🔍 [validateForm] Validating form data:', formData)
      console.log('🔍 [validateForm] Is edit mode:', isEdit)

      // Name validation
      if (!formData.name.trim()) {
        console.log('❌ [validateForm] Name validation failed: empty')
        errors.name = 'Nama API Key tidak boleh kosong'
      } else if (formData.name.length > 100) {
        console.log('❌ [validateForm] Name validation failed: too long')
        errors.name = 'Nama API Key maksimal 100 karakter'
      } else {
        console.log('✅ [validateForm] Name validation passed')
      }

      // API Key validation (only for create, not edit)
      if (!isEdit) {
        if (!formData.apiKey.trim()) {
          console.log('❌ [validateForm] API Key validation failed: empty')
          errors.apiKey = 'API Key tidak boleh kosong'
        } else if (formData.apiKey.length < 10) {
          console.log('❌ [validateForm] API Key validation failed: too short')
          errors.apiKey = 'API Key minimal 10 karakter'
        } else {
          console.log('✅ [validateForm] API Key validation passed')
        }
      }

      // Server URL validation
      if (!formData.serverUrl.trim()) {
        console.log('❌ [validateForm] Server URL validation failed: empty')
        errors.serverUrl = 'Server URL tidak boleh kosong'
      } else if (!formData.serverUrl.startsWith('http://') && !formData.serverUrl.startsWith('https://')) {
        console.log('❌ [validateForm] Server URL validation failed: invalid protocol')
        errors.serverUrl = 'Server URL harus dimulai dengan http:// atau https://'
      } else {
        console.log('✅ [validateForm] Server URL validation passed')
      }

      // Description validation (optional)
      if (formData.description && formData.description.length > 500) {
        console.log('❌ [validateForm] Description validation failed: too long')
        errors.description = 'Deskripsi maksimal 500 karakter'
      }

      console.log('🔍 [validateForm] Final errors:', errors)
      console.log('🔍 [validateForm] Validation result:', Object.keys(errors).length === 0)

      set({ validationErrors: errors })
      return Object.keys(errors).length === 0
    },

    // API Key data management
    setAPIKeys: (apiKeys) => set({ apiKeys }),
    addAPIKey: (apiKey) => set((state) => ({
      apiKeys: [apiKey, ...state.apiKeys]
    })),
    updateAPIKey: (id, updatedAPIKey) => set((state) => ({
      apiKeys: state.apiKeys.map(key =>
        key.id === id ? { ...key, ...updatedAPIKey } : key
      )
    })),
    removeAPIKey: (id) => set((state) => ({
      apiKeys: state.apiKeys.filter(key => key.id !== id)
    })),

    // Search and filter
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilterStatus: (status) => set({ filterStatus: status }),

    // Get filtered API keys
    getFilteredAPIKeys: () => {
      const state = get()
      let filtered = state.apiKeys

      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        filtered = filtered.filter(key =>
          key.name.toLowerCase().includes(query) ||
          key.description?.toLowerCase().includes(query) ||
          key.serverUrl.toLowerCase().includes(query)
        )
      }

      // Apply status filter
      if (state.filterStatus !== 'all') {
        filtered = filtered.filter(key =>
          state.filterStatus === 'active' ? key.isActive : !key.isActive
        )
      }

      return filtered
    },

    // Pagination
    setPagination: (pagination) => set({ pagination }),

    // Utility functions
    getAPIKeyById: (id) => {
      const state = get()
      return state.apiKeys.find(key => key.id === id)
    },

    getActiveAPIKeys: () => {
      const state = get()
      return state.apiKeys.filter(key => key.isActive)
    },

    // Reset store
    reset: () => set({
      apiKeys: [],
      selectedAPIKey: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isActivating: false,
      error: null,
      successMessage: null,
      showCreateModal: false,
      showEditModal: false,
      showDeleteModal: false,
      formData: {
        name: '',
        description: '',
        apiKey: '',
        serverUrl: ''
      },
      validationErrors: {},
      searchQuery: '',
      filterStatus: 'all',
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
      }
    })
  }))
)

export { useAPIKeyStore }