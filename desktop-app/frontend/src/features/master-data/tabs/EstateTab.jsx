import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, FormModal, DeleteConfirmModal } from '../components';
import { useEntityState, useEntityActions, ENTITY_TYPES } from '../useMasterDataStore';
import { useWailsService } from '../../../shared/contexts/WailsContext';
import { useAuthStore } from '../../auth';
import { clearPKSMasterDataCache } from '../../timbang1/store/usePKSStore';

/**
 * EstateTab Component
 *
 * Manages Estate master data with full CRUD operations
 */

const EstateTab = ({ syncRefreshToken = 0 }) => {
  // Services and Auth
  const masterDataService = useWailsService('masterData');
  const { user } = useAuthStore();

  // State and actions from Zustand store
  const {
    data: estateData,
    pagination,
    search,
    loading,
    error,
    modals,
    selectedItem
  } = useEntityState(ENTITY_TYPES.ESTATE);

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
  } = useEntityActions(ENTITY_TYPES.ESTATE);

  // Local state for form handling
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Table configuration
  const tableColumns = [
    {
      key: 'kode_estate',
      title: 'Kode',
      width: '120',
      sortable: true
    },
    {
      key: 'nama_estate',
      title: 'Nama Estate',
      width: '200',
      sortable: true
    },
    {
      key: 'luas',
      title: 'Luas (Ha)',
      width: '120',
      sortable: true,
      render: (value) => value ? `${parseFloat(value).toLocaleString()}` : '-'
    },
    {
      key: 'lokasi',
      title: 'Lokasi',
      width: '200',
      sortable: false,
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value || '-'}
        </div>
      )
    },
    {
      key: 'data_source',
      title: 'Sumber',
      width: '110',
      sortable: true,
      render: (value) => {
        const source = String(value || 'MANUAL').toUpperCase();
        const isServer = source === 'SERVER';
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isServer
            ? 'bg-blue-100 text-blue-800'
            : 'bg-amber-100 text-amber-800'
            }`}>
            {source}
          </span>
        );
      }
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
      label: 'Kode Estate',
      type: 'text',
      required: true,
      placeholder: 'Masukkan kode estate',
      helper: 'Kode unik untuk identifikasi estate',
      validation: (value) => {
        if (!value || value.trim() === '') {
          return 'Kode estate wajib diisi';
        }
        if (value.length > 20) {
          return 'Kode estate maksimal 20 karakter';
        }
        return null;
      }
    },
    {
      name: 'nama',
      label: 'Nama Estate',
      type: 'text',
      required: true,
      placeholder: 'Masukkan nama estate',
      validation: (value) => {
        if (!value || value.trim() === '') {
          return 'Nama estate wajib diisi';
        }
        if (value.length > 100) {
          return 'Nama estate maksimal 100 karakter';
        }
        return null;
      }
    },
    {
      name: 'luas',
      label: 'Luas (Hektare)',
      type: 'number',
      required: false,
      placeholder: 'Masukkan luas area',
      helper: 'Luas estate dalam hektare',
      min: 0,
      step: '0.01',
      validation: (value) => {
        if (value && parseFloat(value) < 0) {
          return 'Luas tidak boleh negatif';
        }
        if (value && parseFloat(value) > 999999.99) {
          return 'Luas maksimal 999,999.99 ha';
        }
        return null;
      }
    },
    {
      name: 'lokasi',
      label: 'Lokasi',
      type: 'text',
      required: false,
      placeholder: 'Masukkan lokasi estate',
      helper: 'Lokasi geografis estate',
      validation: (value) => {
        if (value && value.length > 200) {
          return 'Lokasi maksimal 200 karakter';
        }
        return null;
      }
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
    // Map from API response (snake_case + boolean) to form fields
    return {
      kode: selectedItem.kode_estate,
      nama: selectedItem.nama_estate,
      luas: selectedItem.luas,
      lokasi: selectedItem.lokasi,
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

      // Backend returns array of estates directly
      const estates = await masterDataService.getEstates(false);

      if (Array.isArray(estates)) {
        setData(estates);
        setPagination({ page, limit: 10, total: estates.length, totalPages: Math.ceil(estates.length / 10) });
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading estate data');
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
      const estateData = {
        kodeEstate: formData.kode,
        namaEstate: formData.nama,
        luas: parseFloat(formData.luas) || 0,
        lokasi: formData.lokasi || ''
      };

      // Backend returns the created estate object directly
      const createdEstate = await masterDataService.createEstate(estateData, user?.id);

      // Optimistic update
      addItem(createdEstate);
      closeModal('create');
      clearPKSMasterDataCache();
      // Reload data to get fresh list
      await loadData(pagination.page, search);
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating estate');
    }
  };

  // Handle update
  const handleUpdate = async (formData) => {
    try {
      if (!selectedItem?.id) {
        setFormError('No estate selected for update');
        return;
      }

      setFormError(null);

      if (!masterDataService) throw new Error('Service not available');

      // Map form data to backend expected format
      const estateData = {
        namaEstate: formData.nama,
        luas: parseFloat(formData.luas) || 0,
        lokasi: formData.lokasi || '',
        isActive: !!formData.isActive
      };

      // Backend returns the updated estate object directly
      const updatedEstate = await masterDataService.updateEstate(selectedItem.id, estateData, user?.id);

      // Optimistic update
      updateItem(selectedItem.id, updatedEstate);
      closeModal('edit');
      clearPKSMasterDataCache();
    } catch (err) {
      setFormError(err.message || 'An error occurred while updating estate');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      if (!selectedItem?.id) {
        setDeleteError('No estate selected for deletion');
        return;
      }

      setDeleteError(null);
      setLoading(true);

      if (!masterDataService) throw new Error('Service not available');

      await masterDataService.deleteEstate(selectedItem.id, user?.id);

      removeItem(selectedItem.id);
      closeModal('delete');
      clearPKSMasterDataCache();
      if (estateData.length === 1 && pagination.page > 1) {
        await loadData(pagination.page - 1, search);
      } else {
        await loadData(pagination.page, search);
      }
    } catch (err) {
      setDeleteError(typeof err === 'string' ? err : (err.message || 'Terjadi kesalahan saat menghapus estate'));
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

  useEffect(() => {
    if (syncRefreshToken > 0) {
      loadData(pagination.page, search);
    }
  }, [syncRefreshToken]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Kelola Estate</h2>
          <p className="text-sm text-gray-500">Master data estate untuk sistem penimbangan</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Estate
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
        data={estateData}
        columns={tableColumns}
        loading={loading}
        pagination={pagination}
        search={search}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        canEdit={(item) => String(item?.data_source || 'MANUAL').toUpperCase() !== 'SERVER'}
        canDelete={(item) => String(item?.data_source || 'MANUAL').toUpperCase() !== 'SERVER'}
        selectable={false}
        actions={true}
      />

      {/* Create Modal */}
      <FormModal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        onSubmit={handleCreate}
        title="Tambah Estate Baru"
        description="Masukkan informasi estate yang akan ditambahkan"
        fields={formFields}
        initialValues={emptyInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Simpan Estate"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        onSubmit={handleUpdate}
        title="Edit Estate"
        description="Perbarui informasi estate"
        fields={formFields}
        initialValues={editInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Update Estate"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onConfirm={handleDelete}
        title="Hapus Estate"
        message="Apakah Anda yakin ingin menghapus estate ini? Tindakan ini tidak dapat dibatalkan."
        itemName={selectedItem?.nama_estate || selectedItem?.kode_estate}
        isLoading={loading}
        dangerous={true}
        error={deleteError}
      />
    </div>
  );
};

export default EstateTab;
