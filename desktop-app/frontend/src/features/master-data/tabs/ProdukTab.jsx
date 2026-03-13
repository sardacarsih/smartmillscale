import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, FormModal, DeleteConfirmModal } from '../components';
import { useEntityState, useEntityActions, ENTITY_TYPES } from '../useMasterDataStore';
import { useWailsService } from '../../../shared/contexts/WailsContext';
import { useAuthStore } from '../../auth';
import { clearPKSMasterDataCache } from '../../timbang1/store/usePKSStore';

/**
 * ProdukTab Component
 *
 * Manages Produk (Product) master data with full CRUD operations
 */

const ProdukTab = () => {
  // Services and Auth
  const masterDataService = useWailsService('masterData');
  const { user } = useAuthStore();

  // State and actions from Zustand store
  const {
    data: produkData,
    pagination,
    search,
    loading,
    error,
    modals,
    selectedItem
  } = useEntityState(ENTITY_TYPES.PRODUK);

  const {
    setData,
    setPagination,
    setSearch,
    setLoading,
    setError,
    openModal,
    closeModal,
    closeAllModals,
    addItem,
    updateItem,
    removeItem
  } = useEntityActions(ENTITY_TYPES.PRODUK);

  // Local state for form handling
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Table configuration
  const tableColumns = React.useMemo(() => [
    {
      key: 'kode_produk',
      title: 'Kode',
      width: '120',
      sortable: true
    },
    {
      key: 'nama_produk',
      title: 'Nama Produk',
      width: '200',
      sortable: true
    },
    {
      key: 'kategori',
      title: 'Kategori',
      width: '150',
      sortable: true,
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value || '-'}
        </div>
      )
    },
    {
      key: 'is_active',
      title: 'Status',
      width: '100',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
          }`}>
          {value ? 'AKTIF' : 'TIDAK AKTIF'}
        </span>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      width: '150',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ], []);

  // Form configuration
  const formFields = React.useMemo(() => [
    {
      name: 'kode',
      label: 'Kode Produk',
      type: 'text',
      required: true,
      placeholder: 'Masukkan kode produk',
      helper: 'Kode unik untuk identifikasi produk',
      validation: (value) => {
        if (!value || value.trim() === '') {
          return 'Kode produk wajib diisi';
        }
        if (value.length > 50) {
          return 'Kode produk maksimal 50 karakter';
        }
        return null;
      }
    },
    {
      name: 'nama',
      label: 'Nama Produk',
      type: 'text',
      required: true,
      placeholder: 'Masukkan nama produk',
      validation: (value) => {
        if (!value || value.trim() === '') {
          return 'Nama produk wajib diisi';
        }
        if (value.length > 100) {
          return 'Nama produk maksimal 100 karakter';
        }
        return null;
      }
    },
    {
      name: 'kategori',
      label: 'Kategori',
      type: 'text',
      required: false,
      placeholder: 'Masukkan kategori produk',
      helper: 'Kategori produk (mis: TBS, CPO, Kernel)'
    },
    {
      name: 'isActive',
      label: 'Status Aktif',
      type: 'checkbox',
      required: false
    }
  ], []);

  // Use a stable reference for empty initial values to prevent infinite loops
  const emptyInitialValues = React.useMemo(() => ({ isActive: true }), []);
  const editInitialValues = React.useMemo(() => {
    if (!selectedItem) return emptyInitialValues;
    // Map from API response (snake_case) to form fields
    return {
      kode: selectedItem.kode_produk,
      nama: selectedItem.nama_produk,
      kategori: selectedItem.kategori,
      isActive: selectedItem.is_active
    };
  }, [selectedItem, emptyInitialValues]);

  // Load data
  const loadData = async (page = 1, searchQuery = search) => {
    try {
      setLoading(true);
      setError(null);
      setFormError(null);
      setDeleteError(null);

      if (!masterDataService) return;

      // Backend returns array of products directly
      const products = await masterDataService.getProducts(false);

      if (Array.isArray(products)) {
        setData(products);
        setPagination({ page, limit: 10, total: products.length, totalPages: Math.ceil(products.length / 10) });
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading produk data');
    } finally {
      setLoading(false);
    }
  };

  // Handle create
  const handleCreate = async (formData) => {
    try {
      setFormError(null);

      if (!masterDataService) throw new Error('Service not available');

      // Map form data to backend expected format
      const productData = {
        kodeProduk: formData.kode,
        namaProduk: formData.nama,
        kategori: formData.kategori || ''
      };

      // Backend returns the created product object directly
      const createdProduct = await masterDataService.createProduct(productData, user?.id);

      // Optimistic update
      addItem(createdProduct);
      closeModal('create');
      // Clear PKS master data cache to ensure fresh data on next load
      clearPKSMasterDataCache();
      // Reload data to get fresh list
      await loadData(pagination.page, search);
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating produk');
    }
  };

  // Handle update
  const handleUpdate = async (formData) => {
    try {
      if (!selectedItem?.id) {
        setFormError('No produk selected for update');
        return;
      }

      setFormError(null);

      if (!masterDataService) throw new Error('Service not available');

      // Map form data to backend expected format
      const productData = {
        namaProduk: formData.nama,
        kategori: formData.kategori || '',
        isActive: !!formData.isActive
      };

      // Backend returns the updated product object directly
      const updatedProduct = await masterDataService.updateProduct(selectedItem.id, productData, user?.id);

      // Optimistic update
      updateItem(selectedItem.id, updatedProduct);
      closeModal('edit');
      // Clear PKS master data cache to ensure fresh data on next load
      clearPKSMasterDataCache();
    } catch (err) {
      setFormError(err.message || 'An error occurred while updating produk');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      if (!selectedItem?.id) {
        setDeleteError('No produk selected for deletion');
        return;
      }

      setDeleteError(null);
      setLoading(true);

      if (!masterDataService) throw new Error('Service not available');

      await masterDataService.deleteProduct(selectedItem.id, user?.id);

      removeItem(selectedItem.id);
      closeModal('delete');
      clearPKSMasterDataCache();
      if (produkData.length === 1 && pagination.page > 1) {
        await loadData(pagination.page - 1, search);
      } else {
        await loadData(pagination.page, search);
      }
    } catch (err) {
      setDeleteError(typeof err === 'string' ? err : (err.message || 'Terjadi kesalahan saat menghapus produk'));
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleSearchChange = (value) => {
    setSearch(value);
    loadData(1, value);
  };

  const handlePageChange = (page) => {
    loadData(page, search);
  };

  const handleEdit = (item) => {
    openModal('edit', item);
  };

  const handleDeleteClick = (item) => {
    openModal('delete', item);
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Kelola Produk</h2>
          <p className="text-sm text-gray-500">Master data produk untuk sistem penimbangan</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Produk
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={produkData}
        columns={tableColumns}
        loading={loading}
        pagination={pagination}
        search={search}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        selectable={false}
        actions={true}
      />

      {/* Create Modal */}
      <FormModal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        onSubmit={handleCreate}
        title="Tambah Produk Baru"
        description="Masukkan informasi produk yang akan ditambahkan"
        fields={formFields}
        initialValues={emptyInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Simpan Produk"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        onSubmit={handleUpdate}
        title="Edit Produk"
        description="Perbarui informasi produk"
        fields={formFields}
        initialValues={editInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Update Produk"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onConfirm={handleDelete}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        itemName={selectedItem?.nama_produk || selectedItem?.kode_produk}
        isLoading={loading}
        dangerous={true}
        error={deleteError}
      />
    </div>
  );
};

export default ProdukTab;