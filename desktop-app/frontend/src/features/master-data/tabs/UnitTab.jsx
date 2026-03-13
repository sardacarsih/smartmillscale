import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, FormModal, DeleteConfirmModal } from '../components';
import { useEntityState, useEntityActions, ENTITY_TYPES } from '../useMasterDataStore';
import { useWailsService } from '../../../shared/contexts/WailsContext';
import { useAuthStore } from '../../auth';
import { clearPKSMasterDataCache } from '../../timbang1/store/usePKSStore';

/**
 * UnitTab Component
 *
 * Manages Unit (Measurement Unit) master data with full CRUD operations
 */

const UnitTab = () => {
  // Services and Auth
  const masterDataService = useWailsService('masterData');
  const { user } = useAuthStore();

  // State and actions from Zustand store
  const {
    data: unitData,
    pagination,
    search,
    loading,
    error,
    modals,
    selectedItem
  } = useEntityState(ENTITY_TYPES.UNIT);

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
  } = useEntityActions(ENTITY_TYPES.UNIT);

  // Local state for form handling
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Table configuration
  const tableColumns = [
    {
      key: 'nomor_polisi',
      title: 'Kode / No. Polisi',
      width: '150',
      sortable: true
    },
    {
      key: 'nama_kendaraan',
      title: 'Nama Unit',
      width: '200',
      sortable: true
    },
    {
      key: 'jenis_kendaraan',
      title: 'Jenis / Deskripsi',
      width: '200',
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
  ];

  // Form configuration
  const formFields = [
    {
      name: 'nomorPolisi',
      label: 'Nomor Polisi',
      type: 'text',
      required: true,
      placeholder: 'Masukkan nomor polisi',
      helper: 'Nomor polisi kendaraan (contoh: B 1234 ABC)',
      validation: (value) => {
        if (!value || value.trim() === '') {
          return 'Nomor polisi wajib diisi';
        }
        if (value.length > 20) {
          return 'Nomor polisi maksimal 20 karakter';
        }
        return null;
      }
    },
    {
      name: 'namaKendaraan',
      label: 'Nama Kendaraan',
      type: 'text',
      required: true,
      placeholder: 'Masukkan nama kendaraan',
      helper: 'Nama/deskripsi kendaraan (contoh: Truk Fuso)',
      validation: (value) => {
        if (!value || value.trim() === '') {
          return 'Nama kendaraan wajib diisi';
        }
        if (value.length > 100) {
          return 'Nama kendaraan maksimal 100 karakter';
        }
        return null;
      }
    },
    {
      name: 'jenisKendaraan',
      label: 'Jenis Kendaraan',
      type: 'text',
      required: false,
      placeholder: 'Masukkan jenis kendaraan',
      helper: 'Jenis kendaraan (contoh: Truk, Pickup, dll)'
    },
    {
      name: 'kapasitasMax',
      label: 'Kapasitas Maksimal (Ton)',
      type: 'number',
      required: false,
      placeholder: 'Masukkan kapasitas maksimal',
      helper: 'Kapasitas maksimal dalam ton',
      min: 0,
      step: '0.01'
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
    // Map from API response (snake_case) to form fields (camelCase)
    return {
      nomorPolisi: selectedItem.nomor_polisi,
      namaKendaraan: selectedItem.nama_kendaraan,
      jenisKendaraan: selectedItem.jenis_kendaraan,
      kapasitasMax: selectedItem.kapasitas_max,
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

      // Backend returns array of units directly
      const units = await masterDataService.getUnits(false);

      if (Array.isArray(units)) {
        setData(units);
        setPagination({ page, limit: 10, total: units.length, totalPages: Math.ceil(units.length / 10) });
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading unit data');
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
      const unitData = {
        nomorPolisi: formData.nomorPolisi,
        namaKendaraan: formData.namaKendaraan,
        jenisKendaraan: formData.jenisKendaraan || '',
        kapasitasMax: parseFloat(formData.kapasitasMax) || 0
      };

      // Backend returns the created unit object directly
      const createdUnit = await masterDataService.createUnit(unitData, user?.id);

      // Optimistic update
      addItem(createdUnit);
      closeModal('create');
      clearPKSMasterDataCache();
      // Reload data to get fresh list
      await loadData(pagination.page, search);
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating unit');
    }
  };

  // Handle update
  const handleUpdate = async (formData) => {
    try {
      if (!selectedItem?.id) {
        setFormError('No unit selected for update');
        return;
      }

      setFormError(null);

      if (!masterDataService) throw new Error('Service not available');

      // Map form data to backend expected format
      const unitData = {
        namaKendaraan: formData.namaKendaraan,
        jenisKendaraan: formData.jenisKendaraan || '',
        kapasitasMax: parseFloat(formData.kapasitasMax) || 0,
        isActive: !!formData.isActive
      };

      // Backend returns the updated unit object directly
      const updatedUnit = await masterDataService.updateUnit(selectedItem.id, unitData, user?.id);

      // Optimistic update
      updateItem(selectedItem.id, updatedUnit);
      closeModal('edit');
      clearPKSMasterDataCache();
    } catch (err) {
      setFormError(err.message || 'An error occurred while updating unit');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      if (!selectedItem?.id) {
        setDeleteError('No unit selected for deletion');
        return;
      }

      setDeleteError(null);
      setLoading(true);

      if (!masterDataService) throw new Error('Service not available');

      await masterDataService.deleteUnit(selectedItem.id, user?.id);

      removeItem(selectedItem.id);
      closeModal('delete');
      clearPKSMasterDataCache();
      if (unitData.length === 1 && pagination.page > 1) {
        await loadData(pagination.page - 1, search);
      } else {
        await loadData(pagination.page, search);
      }
    } catch (err) {
      setDeleteError(typeof err === 'string' ? err : (err.message || 'Terjadi kesalahan saat menghapus unit'));
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
          <h2 className="text-lg font-semibold text-gray-900">Kelola Unit</h2>
          <p className="text-sm text-gray-500">Master data unit pengukuran untuk sistem penimbangan</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Unit
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
        data={unitData}
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
        title="Tambah Unit Baru"
        description="Masukkan informasi unit pengukuran yang akan ditambahkan"
        fields={formFields}
        initialValues={emptyInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Simpan Unit"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        onSubmit={handleUpdate}
        title="Edit Unit"
        description="Perbarui informasi unit pengukuran"
        fields={formFields}
        initialValues={editInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Update Unit"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onConfirm={handleDelete}
        title="Hapus Unit"
        message="Apakah Anda yakin ingin menghapus unit ini? Tindakan ini tidak dapat dibatalkan."
        itemName={selectedItem?.nama_kendaraan || selectedItem?.nomor_polisi}
        isLoading={loading}
        dangerous={true}
        error={deleteError}
      />
    </div>
  );
};

export default UnitTab;