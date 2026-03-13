import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

/**
 * Master Data Zustand Store
 *
 * Modern state management for master data operations with support for:
 * - All 6 master data entities (Produk, Unit, Supplier, Estate, Afdeling, Blok)
 * - CRUD operations with optimistic updates
 * - Pagination and search functionality
 * - Loading states and error handling
 * - React Query integration for caching
 */

// Entity types for the 6 master data entities
export const ENTITY_TYPES = {
  PRODUK: 'produk',
  UNIT: 'unit',
  SUPPLIER: 'supplier',
  ESTATE: 'estate',
  AFDELING: 'afdeling',
  BLOK: 'blok'
};

// Store state shape
export const useMasterDataStore = create(
  persist(
    (set, get) => ({
      // Active entity state
      activeEntity: ENTITY_TYPES.PRODUK,
      setActiveEntity: (entity) => set({ activeEntity: entity }),

      // Data state for all entities
      data: {
        [ENTITY_TYPES.PRODUK]: [],
        [ENTITY_TYPES.UNIT]: [],
        [ENTITY_TYPES.SUPPLIER]: [],
        [ENTITY_TYPES.ESTATE]: [],
        [ENTITY_TYPES.AFDELING]: [],
        [ENTITY_TYPES.BLOK]: []
      },

      // Pagination state
      pagination: {
        [ENTITY_TYPES.PRODUK]: { page: 1, limit: 10, total: 0, totalPages: 0 },
        [ENTITY_TYPES.UNIT]: { page: 1, limit: 10, total: 0, totalPages: 0 },
        [ENTITY_TYPES.SUPPLIER]: { page: 1, limit: 10, total: 0, totalPages: 0 },
        [ENTITY_TYPES.ESTATE]: { page: 1, limit: 10, total: 0, totalPages: 0 },
        [ENTITY_TYPES.AFDELING]: { page: 1, limit: 10, total: 0, totalPages: 0 },
        [ENTITY_TYPES.BLOK]: { page: 1, limit: 10, total: 0, totalPages: 0 }
      },

      // Search and filter state
      search: {
        [ENTITY_TYPES.PRODUK]: '',
        [ENTITY_TYPES.UNIT]: '',
        [ENTITY_TYPES.SUPPLIER]: '',
        [ENTITY_TYPES.ESTATE]: '',
        [ENTITY_TYPES.AFDELING]: '',
        [ENTITY_TYPES.BLOK]: ''
      },

      // Loading states
      loading: {
        [ENTITY_TYPES.PRODUK]: false,
        [ENTITY_TYPES.UNIT]: false,
        [ENTITY_TYPES.SUPPLIER]: false,
        [ENTITY_TYPES.ESTATE]: false,
        [ENTITY_TYPES.AFDELING]: false,
        [ENTITY_TYPES.BLOK]: false
      },

      // Modal states
      modals: {
        [ENTITY_TYPES.PRODUK]: { create: false, edit: false, delete: false },
        [ENTITY_TYPES.UNIT]: { create: false, edit: false, delete: false },
        [ENTITY_TYPES.SUPPLIER]: { create: false, edit: false, delete: false },
        [ENTITY_TYPES.ESTATE]: { create: false, edit: false, delete: false },
        [ENTITY_TYPES.AFDELING]: { create: false, edit: false, delete: false },
        [ENTITY_TYPES.BLOK]: { create: false, edit: false, delete: false }
      },

      // Selected items for operations
      selectedItems: {
        [ENTITY_TYPES.PRODUK]: null,
        [ENTITY_TYPES.UNIT]: null,
        [ENTITY_TYPES.SUPPLIER]: null,
        [ENTITY_TYPES.ESTATE]: null,
        [ENTITY_TYPES.AFDELING]: null,
        [ENTITY_TYPES.BLOK]: null
      },

      // Error states
      errors: {
        [ENTITY_TYPES.PRODUK]: null,
        [ENTITY_TYPES.UNIT]: null,
        [ENTITY_TYPES.SUPPLIER]: null,
        [ENTITY_TYPES.ESTATE]: null,
        [ENTITY_TYPES.AFDELING]: null,
        [ENTITY_TYPES.BLOK]: null
      },

      // Actions
      setData: (entity, data) => set((state) => ({
        data: { ...state.data, [entity]: data }
      })),

      setPagination: (entity, pagination) => set((state) => ({
        pagination: { ...state.pagination, [entity]: pagination }
      })),

      setSearch: (entity, search) => set((state) => ({
        search: { ...state.search, [entity]: search }
      })),

      setLoading: (entity, loading) => set((state) => ({
        loading: { ...state.loading, [entity]: loading }
      })),

      setError: (entity, error) => set((state) => ({
        errors: { ...state.errors, [entity]: error }
      })),

      openModal: (entity, modalType, item = null) => set((state) => ({
        modals: {
          ...state.modals,
          [entity]: { ...state.modals[entity], [modalType]: true }
        },
        selectedItems: {
          ...state.selectedItems,
          [entity]: item
        }
      })),

      closeModal: (entity, modalType) => set((state) => ({
        modals: {
          ...state.modals,
          [entity]: { ...state.modals[entity], [modalType]: false }
        },
        selectedItems: {
          ...state.selectedItems,
          [entity]: null
        }
      })),

      closeAllModals: (entity) => set((state) => ({
        modals: {
          ...state.modals,
          [entity]: { create: false, edit: false, delete: false }
        },
        selectedItems: {
          ...state.selectedItems,
          [entity]: null
        }
      })),

      // Optimistic update actions
      addItem: (entity, item) => set((state) => ({
        data: {
          ...state.data,
          [entity]: [item, ...state.data[entity]]
        }
      })),

      updateItem: (entity, id, updates) => set((state) => ({
        data: {
          ...state.data,
          [entity]: state.data[entity].map(item =>
            item.id === id ? { ...item, ...updates } : item
          )
        }
      })),

      removeItem: (entity, id) => set((state) => ({
        data: {
          ...state.data,
          [entity]: state.data[entity].filter(item => item.id !== id)
        }
      })),

      // Bulk actions
      selectMultipleItems: (entity, items) => set((state) => ({
        selectedItems: {
          ...state.selectedItems,
          [entity]: items
        }
      })),

      clearSelection: (entity) => set((state) => ({
        selectedItems: {
          ...state.selectedItems,
          [entity]: null
        }
      })),

      // Reset actions
      resetEntityState: (entity) => set((state) => ({
        data: { ...state.data, [entity]: [] },
        pagination: { ...state.pagination, [entity]: { page: 1, limit: 10, total: 0, totalPages: 0 } },
        search: { ...state.search, [entity]: '' },
        loading: { ...state.loading, [entity]: false },
        errors: { ...state.errors, [entity]: null },
        selectedItems: { ...state.selectedItems, [entity]: null }
      })),

      resetAllStates: () => set({
        data: {
          [ENTITY_TYPES.PRODUK]: [],
          [ENTITY_TYPES.UNIT]: [],
          [ENTITY_TYPES.SUPPLIER]: [],
          [ENTITY_TYPES.ESTATE]: [],
          [ENTITY_TYPES.AFDELING]: [],
          [ENTITY_TYPES.BLOK]: []
        },
        pagination: {
          [ENTITY_TYPES.PRODUK]: { page: 1, limit: 10, total: 0, totalPages: 0 },
          [ENTITY_TYPES.UNIT]: { page: 1, limit: 10, total: 0, totalPages: 0 },
          [ENTITY_TYPES.SUPPLIER]: { page: 1, limit: 10, total: 0, totalPages: 0 },
          [ENTITY_TYPES.ESTATE]: { page: 1, limit: 10, total: 0, totalPages: 0 },
          [ENTITY_TYPES.AFDELING]: { page: 1, limit: 10, total: 0, totalPages: 0 },
          [ENTITY_TYPES.BLOK]: { page: 1, limit: 10, total: 0, totalPages: 0 }
        },
        search: {
          [ENTITY_TYPES.PRODUK]: '',
          [ENTITY_TYPES.UNIT]: '',
          [ENTITY_TYPES.SUPPLIER]: '',
          [ENTITY_TYPES.ESTATE]: '',
          [ENTITY_TYPES.AFDELING]: '',
          [ENTITY_TYPES.BLOK]: ''
        },
        loading: {
          [ENTITY_TYPES.PRODUK]: false,
          [ENTITY_TYPES.UNIT]: false,
          [ENTITY_TYPES.SUPPLIER]: false,
          [ENTITY_TYPES.ESTATE]: false,
          [ENTITY_TYPES.AFDELING]: false,
          [ENTITY_TYPES.BLOK]: false
        },
        errors: {
          [ENTITY_TYPES.PRODUK]: null,
          [ENTITY_TYPES.UNIT]: null,
          [ENTITY_TYPES.SUPPLIER]: null,
          [ENTITY_TYPES.ESTATE]: null,
          [ENTITY_TYPES.AFDELING]: null,
          [ENTITY_TYPES.BLOK]: null
        },
        selectedItems: {
          [ENTITY_TYPES.PRODUK]: null,
          [ENTITY_TYPES.UNIT]: null,
          [ENTITY_TYPES.SUPPLIER]: null,
          [ENTITY_TYPES.ESTATE]: null,
          [ENTITY_TYPES.AFDELING]: null,
          [ENTITY_TYPES.BLOK]: null
        },
        modals: {
          [ENTITY_TYPES.PRODUK]: { create: false, edit: false, delete: false },
          [ENTITY_TYPES.UNIT]: { create: false, edit: false, delete: false },
          [ENTITY_TYPES.SUPPLIER]: { create: false, edit: false, delete: false },
          [ENTITY_TYPES.ESTATE]: { create: false, edit: false, delete: false },
          [ENTITY_TYPES.AFDELING]: { create: false, edit: false, delete: false },
          [ENTITY_TYPES.BLOK]: { create: false, edit: false, delete: false }
        }
      })
    }),
    {
      name: 'master-data-store',
      partialize: (state) => ({
        activeEntity: state.activeEntity,
        search: state.search,
        pagination: state.pagination
      })
    }
  )
);

// Selectors for easier access to specific entity states
export const useEntityData = (entity) => useMasterDataStore((state) => state.data[entity]);
export const useEntityPagination = (entity) => useMasterDataStore((state) => state.pagination[entity]);
export const useEntitySearch = (entity) => useMasterDataStore((state) => state.search[entity]);
export const useEntityLoading = (entity) => useMasterDataStore((state) => state.loading[entity]);
export const useEntityError = (entity) => useMasterDataStore((state) => state.errors[entity]);
export const useEntityModals = (entity) => useMasterDataStore((state) => state.modals[entity]);
export const useEntitySelectedItem = (entity) => useMasterDataStore((state) => state.selectedItems[entity]);

// Combined selectors for common patterns
export const useEntityState = (entity) => useMasterDataStore(useShallow((state) => ({
  data: state.data[entity],
  pagination: state.pagination[entity],
  search: state.search[entity],
  loading: state.loading[entity],
  error: state.errors[entity],
  modals: state.modals[entity],
  selectedItem: state.selectedItems[entity]
})));

export const useEntityActions = (entity) => {
  const setData = useMasterDataStore((state) => state.setData);
  const setPagination = useMasterDataStore((state) => state.setPagination);
  const setSearch = useMasterDataStore((state) => state.setSearch);
  const setLoading = useMasterDataStore((state) => state.setLoading);
  const setError = useMasterDataStore((state) => state.setError);
  const openModal = useMasterDataStore((state) => state.openModal);
  const closeModal = useMasterDataStore((state) => state.closeModal);
  const closeAllModals = useMasterDataStore((state) => state.closeAllModals);
  const addItem = useMasterDataStore((state) => state.addItem);
  const updateItem = useMasterDataStore((state) => state.updateItem);
  const removeItem = useMasterDataStore((state) => state.removeItem);
  const selectMultipleItems = useMasterDataStore((state) => state.selectMultipleItems);
  const clearSelection = useMasterDataStore((state) => state.clearSelection);
  const resetState = useMasterDataStore((state) => state.resetEntityState);

  return React.useMemo(() => ({
    setData: (data) => setData(entity, data),
    setPagination: (pagination) => setPagination(entity, pagination),
    setSearch: (search) => setSearch(entity, search),
    setLoading: (loading) => setLoading(entity, loading),
    setError: (error) => setError(entity, error),
    openModal: (modalType, item) => openModal(entity, modalType, item),
    closeModal: (modalType) => closeModal(entity, modalType),
    closeAllModals: () => closeAllModals(entity),
    addItem: (item) => addItem(entity, item),
    updateItem: (id, updates) => updateItem(entity, id, updates),
    removeItem: (id) => removeItem(entity, id),
    selectMultipleItems: (items) => selectMultipleItems(entity, items),
    clearSelection: () => clearSelection(entity),
    resetState: () => resetState(entity)
  }), [entity, setData, setPagination, setSearch, setLoading, setError, openModal, closeModal, closeAllModals, addItem, updateItem, removeItem, selectMultipleItems, clearSelection, resetState]);
};

export default useMasterDataStore;