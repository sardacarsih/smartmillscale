import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, FormModal, DeleteConfirmModal } from '../components';
import { useEntityState, useEntityActions, ENTITY_TYPES } from '../useMasterDataStore';
import { useWailsService } from '../../../shared/contexts/WailsContext';
import { useAuthStore } from '../../auth';
import { clearPKSMasterDataCache } from '../../timbang1/store/usePKSStore';

/**
 * AfdelingTab Component
 *
 * Manages Afdeling master data with full CRUD operations
 */

const AfdelingTab = ({ syncRefreshToken = 0 }) => {
  // Services and Auth
  const masterDataService = useWailsService('masterData');
  const { user } = useAuthStore();

  // State and actions from Zustand store
  const {
    data: afdelingData,
    pagination,
    search,
    loading,
    error,
    modals,
    selectedItem
  } = useEntityState(ENTITY_TYPES.AFDELING);

  const {
    setData,
    setPagination,
    setSearch,
    setLoading,
    setError,
    openModal,
    closeModal,
    addItem,
    updateItem,
    removeItem
  } = useEntityActions(ENTITY_TYPES.AFDELING);

  // Local state
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [estates, setEstates] = useState([]);

  // Table configuration
  const tableColumns = [
    { key: 'kode_afdeling', title: 'Kode', width: '120', sortable: true },
    { key: 'nama_afdeling', title: 'Nama Afdeling', width: '200', sortable: true },
    { key: 'estate.nama_estate', title: 'Estate', width: '180', sortable: true, render: (value, row) => row.estate?.nama_estate || '-' },
    { key: 'luas', title: 'Luas (Ha)', width: '120', sortable: true, render: (value) => value ? `${parseFloat(value).toLocaleString()}` : '-' },
    {
    {
      key: 'data_source', title: 'Sumber', width: '110', sortable: true,
      render: (value) => {
        const source = String(value || 'MANUAL').toUpperCase();
        const isServer = source === 'SERVER';
        return (
          <span className={inline-flex px-2 py-1 text-xs font-semibold rounded-full }>
            {source}
          </span>
        );
      }
    },
      key: 'is_active', title: 'Status', width: '100', sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'AKTIF' : 'TIDAK AKTIF'}
        </span>
      )
    }
  ];

  // Form configuration
  const formFields = [
    {
      name: 'kodeAfdeling',
      label: 'Kode Afdeling',
      type: 'text',
      required: true,
      placeholder: 'Masukkan kode afdeling',
      disabled: !!selectedItem,
      validation: (value) => !value?.trim() ? 'Kode afdeling wajib diisi' : value.length > 20 ? 'Maksimal 20 karakter' : null
    },
    {
      name: 'idEstate',
      label: 'Estate',
      type: 'select',
      required: true,
      options: estates.map(e => ({ value: e.id, label: `${e.kode_estate} - ${e.nama_estate}` })),
      validation: (value) => !value ? 'Estate wajib dipilih' : null
    },
    {
      name: 'namaAfdeling',
      label: 'Nama Afdeling',
      type: 'text',
      required: true,
      placeholder: 'Masukkan nama afdeling',
      validation: (value) => !value?.trim() ? 'Nama afdeling wajib diisi' : value.length > 100 ? 'Maksimal 100 karakter' : null
    },
    {
      name: 'luas',
      label: 'Luas (Hektare)',
      type: 'number',
      required: false,
      placeholder: 'Masukkan luas area',
      min: 0,
      step: '0.01',
      validation: (value) => value && parseFloat(value) < 0 ? 'Luas tidak boleh negatif' : null
    },
    {
      name: 'isActive',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: true, label: 'Aktif' },
        { value: false, label: 'Tidak Aktif' }
      ]
    }
  ];

  const emptyInitialValues = React.useMemo(() => ({ isActive: true }), []);
  const editInitialValues = React.useMemo(() => {
    if (!selectedItem) return emptyInitialValues;
    // Map from API response (snake_case) to form fields (camelCase)
    return {
      kodeAfdeling: selectedItem.kode_afdeling,
      namaAfdeling: selectedItem.nama_afdeling,
      idEstate: selectedItem.id_estate,
      luas: selectedItem.luas,
      isActive: selectedItem.is_active
    };
  }, [selectedItem, emptyInitialValues]);

  // Load estates for dropdown
  const loadEstates = async () => {
    try {
      const estateList = await masterDataService.getEstates(true);
      if (Array.isArray(estateList)) {
        setEstates(estateList.filter(e => e.is_active));
      }
    } catch (err) {
      console.error('Failed to load estates:', err);
    }
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!masterDataService) return;

      const afdelings = await masterDataService.getAfdelings(false);
      if (Array.isArray(afdelings)) {
        setData(afdelings);
        setPagination({ page: 1, limit: 10, total: afdelings.length, totalPages: Math.ceil(afdelings.length / 10) });
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to load afdeling data');
    } finally {
      setLoading(false);
    }
  };

  // Handle create
  const handleCreate = async (formData) => {
    try {
      setFormError(null);
      if (!masterDataService) throw new Error('Service not available');

      const afdelingData = {
        idEstate: parseInt(formData.idEstate),
        kodeAfdeling: formData.kodeAfdeling,
        namaAfdeling: formData.namaAfdeling,
        luas: parseFloat(formData.luas) || 0
      };

      const createdAfdeling = await masterDataService.createAfdeling(afdelingData, user?.id);
      // Optimistic update
      addItem(createdAfdeling);
      closeModal('create');
      clearPKSMasterDataCache();
      // Reload data to get fresh list
      await loadData(pagination.page, search);
    } catch (err) {
      setFormError(err.message || 'Failed to create afdeling');
    }
  };

  // Handle update
  const handleUpdate = async (formData) => {
    try {
      if (!selectedItem?.id) {
        setFormError('No afdeling selected');
        return;
      }
      setFormError(null);
      if (!masterDataService) throw new Error('Service not available');

      const afdelingData = {
        namaAfdeling: formData.namaAfdeling,
        luas: parseFloat(formData.luas) || 0,
        isActive: !!formData.isActive
      };

      const updatedAfdeling = await masterDataService.updateAfdeling(selectedItem.id, afdelingData, user?.id);
      // Optimistic update
      updateItem(selectedItem.id, updatedAfdeling);
      closeModal('edit');
      clearPKSMasterDataCache();
    } catch (err) {
      setFormError(err.message || 'Failed to update afdeling');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      if (!selectedItem?.id) {
        setDeleteError('No afdeling selected');
        return;
      }
      setDeleteError(null);
      setLoading(true);
      if (!masterDataService) throw new Error('Service not available');

      await masterDataService.deleteAfdeling(selectedItem.id, user?.id);
      removeItem(selectedItem.id);
      closeModal('delete');
      clearPKSMasterDataCache();
      if (afdelingData.length === 1 && pagination.page > 1) {
        await loadData(pagination.page - 1, search);
      } else {
        await loadData(pagination.page, search);
      }
    } catch (err) {
      setDeleteError(typeof err === 'string' ? err : (err.message || 'Terjadi kesalahan saat menghapus afdeling'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstates();
    loadData();
  }, []);

  useEffect(() => {
    if (syncRefreshToken > 0) {
      loadEstates();
      loadData();
    }
  }, [syncRefreshToken]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Kelola Afdeling</h2>
          <p className="text-sm text-gray-500">Master data afdeling untuk sistem penimbangan</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Afdeling
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      <DataTable
        data={afdelingData}
        columns={tableColumns}
        loading={loading}
        pagination={pagination}
        search={search}
        onSearchChange={(value) => { setSearch(value); loadData(); }}
        onPageChange={(page) => loadData()}
        onEdit={(item) => openModal('edit', item)}
        onDelete={(item) => openModal('delete', item)}
        canEdit={(item) => String(item?.data_source || 'MANUAL').toUpperCase() !== 'SERVER'}
        canDelete={(item) => String(item?.data_source || 'MANUAL').toUpperCase() !== 'SERVER'}
        selectable={false}
        actions={true}
      />

      <FormModal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        onSubmit={handleCreate}
        title="Tambah Afdeling Baru"
        description="Masukkan informasi afdeling yang akan ditambahkan"
        fields={formFields}
        initialValues={emptyInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Simpan Afdeling"
      />

      <FormModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        onSubmit={handleUpdate}
        title="Edit Afdeling"
        description="Perbarui informasi afdeling"
        fields={formFields}
        initialValues={editInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Update Afdeling"
      />

      <DeleteConfirmModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onConfirm={handleDelete}
        title="Hapus Afdeling"
        message="Apakah Anda yakin ingin menghapus afdeling ini? Tindakan ini tidak dapat dibatalkan."
        itemName={selectedItem?.nama_afdeling || selectedItem?.kode_afdeling}
        isLoading={loading}
        dangerous={true}
        error={deleteError}
      />
    </div>
  );
};

export default AfdelingTab;
