import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, FormModal, DeleteConfirmModal } from '../components';
import { useEntityState, useEntityActions, ENTITY_TYPES } from '../useMasterDataStore';
import { useWailsService } from '../../../shared/contexts/WailsContext';
import { useAuthStore } from '../../auth';
import { clearPKSMasterDataCache } from '../../timbang1/store/usePKSStore';

/**
 * SupplierTab Component
 *
 * Manages Supplier master data with full CRUD operations
 */

const SupplierTab = () => {
  // Services and Auth
  const masterDataService = useWailsService('masterData');
  const { user } = useAuthStore();

  // State and actions from Zustand store
  const {
    data: supplierData,
    pagination,
    search,
    loading,
    error,
    modals,
    selectedItem
  } = useEntityState(ENTITY_TYPES.SUPPLIER);

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
  } = useEntityActions(ENTITY_TYPES.SUPPLIER);

  // Local state for form handling
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Table configuration
  const tableColumns = [
    {
      key: 'kode_supplier',
      title: 'Kode',
      width: '120',
      sortable: true
    },
    {
      key: 'nama_supplier',
      title: 'Nama Supplier',
      width: '200',
      sortable: true
    },
    {
      key: 'kontak',
      title: 'Kontak',
      width: '150',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'jenis_supplier',
      title: 'Jenis',
      width: '130',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'alamat',
      title: 'Alamat',
      width: '250',
      sortable: false,
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
  ];

  // Form configuration
  const formFields = [
    {
      name: 'kode',
      label: 'Kode Supplier',
      type: 'text',
      required: true,
      placeholder: 'Masukkan kode supplier',
      helper: 'Kode unik untuk identifikasi supplier',
      validation: (value) => {
        if (!value || value.trim() === '') {
          return 'Kode supplier wajib diisi';
        }
        if (value.length > 20) {
          return 'Kode supplier maksimal 20 karakter';
        }
        return null;
      }
    },
    {
      name: 'nama',
      label: 'Nama Supplier',
      type: 'text',
      required: true,
      placeholder: 'Masukkan nama supplier',
      validation: (value) => {
        if (!value || value.trim() === '') {
          return 'Nama supplier wajib diisi';
        }
        if (value.length > 100) {
          return 'Nama supplier maksimal 100 karakter';
        }
        return null;
      }
    },
    {
      name: 'kontak',
      label: 'Nama Kontak',
      type: 'text',
      required: false,
      placeholder: 'Masukkan nama kontak person',
      helper: 'Nama person yang dapat dihubungi'
    },
    {
      name: 'telepon',
      label: 'Telepon',
      type: 'text',
      required: false,
      placeholder: 'Masukkan nomor telepon',
      helper: 'Nomor telepon yang dapat dihubungi',
      validation: (value) => {
        if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
          return 'Nomor telepon hanya boleh mengandung angka, spasi, dan karakter +,-,()';
        }
        if (value && value.length > 20) {
          return 'Nomor telepon maksimal 20 karakter';
        }
        return null;
      }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: false,
      placeholder: 'Masukkan alamat email',
      helper: 'Email untuk komunikasi formal'
    },
    {
      name: 'alamat',
      label: 'Alamat',
      type: 'textarea',
      required: false,
      placeholder: 'Masukkan alamat lengkap',
      rows: 3,
      helper: 'Alamat lengkap supplier'
    },
    {
      name: 'isActive',
      label: 'Status Aktif',
      type: 'checkbox',
      required: false
    }
  ];

  // Memoized initial values to prevent infinite re-renders
  const emptyInitialValues = React.useMemo(() => ({ isActive: true }), []);
  const editInitialValues = React.useMemo(() => {
    if (!selectedItem) return emptyInitialValues;
    // Map from API response (snake_case) to form fields
    return {
      kode: selectedItem.kode_supplier,
      nama: selectedItem.nama_supplier,
      kontak: selectedItem.kontak,
      telepon: selectedItem.telepon,
      email: selectedItem.email,
      alamat: selectedItem.alamat,
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

      // Backend returns array of suppliers directly
      const suppliers = await masterDataService.getSuppliers(false);

      if (Array.isArray(suppliers)) {
        setData(suppliers);
        setPagination({ page, limit: 10, total: suppliers.length, totalPages: Math.ceil(suppliers.length / 10) });
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading supplier data');
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
      const supplierData = {
        kodeSupplier: formData.kode,
        namaSupplier: formData.nama,
        alamat: formData.alamat || '',
        kontak: formData.kontak || '',
        telepon: formData.telepon || '',
        email: formData.email || ''
      };

      // Backend returns the created supplier object directly
      const createdSupplier = await masterDataService.createSupplier(supplierData, user?.id);

      // Optimistic update
      addItem(createdSupplier);
      closeModal('create');
      clearPKSMasterDataCache();
      // Reload data to get fresh list
      await loadData(pagination.page, search);
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating supplier');
    }
  };

  // Handle update
  const handleUpdate = async (formData) => {
    try {
      if (!selectedItem?.id) {
        setFormError('No supplier selected for update');
        return;
      }

      setFormError(null);

      if (!masterDataService) throw new Error('Service not available');

      // Map form data to backend expected format
      const supplierData = {
        namaSupplier: formData.nama,
        alamat: formData.alamat || '',
        kontak: formData.kontak || '',
        telepon: formData.telepon || '',
        email: formData.email || '',
        isActive: !!formData.isActive
      };

      // Backend returns the updated supplier object directly
      const updatedSupplier = await masterDataService.updateSupplier(selectedItem.id, supplierData, user?.id);

      // Optimistic update
      updateItem(selectedItem.id, updatedSupplier);
      closeModal('edit');
      clearPKSMasterDataCache();
    } catch (err) {
      setFormError(err.message || 'An error occurred while updating supplier');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      if (!selectedItem?.id) {
        setDeleteError('No supplier selected for deletion');
        return;
      }

      setDeleteError(null);
      setLoading(true);

      if (!masterDataService) throw new Error('Service not available');

      await masterDataService.deleteSupplier(selectedItem.id, user?.id);

      removeItem(selectedItem.id);
      closeModal('delete');
      clearPKSMasterDataCache();
      if (supplierData.length === 1 && pagination.page > 1) {
        await loadData(pagination.page - 1, search);
      } else {
        await loadData(pagination.page, search);
      }
    } catch (err) {
      setDeleteError(typeof err === 'string' ? err : (err.message || 'Terjadi kesalahan saat menghapus supplier'));
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
          <h2 className="text-lg font-semibold text-gray-900">Kelola Supplier</h2>
          <p className="text-sm text-gray-500">Master data supplier untuk sistem penimbangan</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Supplier
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
        data={supplierData}
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
        title="Tambah Supplier Baru"
        description="Masukkan informasi supplier yang akan ditambahkan"
        fields={formFields}
        initialValues={emptyInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Simpan Supplier"
        size="lg"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        onSubmit={handleUpdate}
        title="Edit Supplier"
        description="Perbarui informasi supplier"
        fields={formFields}
        initialValues={editInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Update Supplier"
        size="lg"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onConfirm={handleDelete}
        title="Hapus Supplier"
        message="Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan."
        itemName={selectedItem?.nama_supplier || selectedItem?.kode_supplier}
        isLoading={loading}
        dangerous={true}
        error={deleteError}
      />
    </div>
  );
};

export default SupplierTab;