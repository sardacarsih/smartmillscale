import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, FormModal, DeleteConfirmModal } from '../components';
import { useEntityState, useEntityActions, ENTITY_TYPES } from '../useMasterDataStore';
import { useWailsService } from '../../../shared/contexts/WailsContext';
import { useAuthStore } from '../../auth';
import { clearPKSMasterDataCache } from '../../timbang1/store/usePKSStore';

/**
 * BlokTab Component
 *
 * Manages Blok master data with full CRUD operations
 */

const BlokTab = () => {
  // Services and Auth
  const masterDataService = useWailsService('masterData');
  const { user } = useAuthStore();

  // State and actions from Zustand store
  const {
    data: blokData,
    pagination,
    search,
    loading,
    error,
    modals,
    selectedItem
  } = useEntityState(ENTITY_TYPES.BLOK);

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
  } = useEntityActions(ENTITY_TYPES.BLOK);

  // Local state
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [afdelings, setAfdelings] = useState([]);

  // Table configuration
  const tableColumns = [
    { key: 'kode_blok', title: 'Kode', width: '120', sortable: true },
    { key: 'nama_blok', title: 'Nama Blok', width: '200', sortable: true },
    { key: 'afdeling.nama_afdeling', title: 'Afdeling', width: '180', sortable: true, render: (value, row) => row.afdeling?.nama_afdeling || '-' },
    { key: 'afdeling.estate.nama_estate', title: 'Estate', width: '180', sortable: true, render: (value, row) => row.afdeling?.estate?.nama_estate || '-' },
    { key: 'luas', title: 'Luas (Ha)', width: '120', sortable: true, render: (value) => value ? `${parseFloat(value).toLocaleString()}` : '-' },
    {
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
      name: 'kodeBlok',
      label: 'Kode Blok',
      type: 'text',
      required: true,
      placeholder: 'Masukkan kode blok',
      disabled: !!selectedItem,
      validation: (value) => !value?.trim() ? 'Kode blok wajib diisi' : value.length > 20 ? 'Maksimal 20 karakter' : null
    },
    {
      name: 'idAfdeling',
      label: 'Afdeling',
      type: 'select',
      required: true,
      options: afdelings.map(a => ({ value: a.id, label: `${a.kode_afdeling} - ${a.nama_afdeling} (${a.estate?.nama_estate || 'N/A'})` })),
      validation: (value) => !value ? 'Afdeling wajib dipilih' : null
    },
    {
      name: 'namaBlok',
      label: 'Nama Blok',
      type: 'text',
      required: true,
      placeholder: 'Masukkan nama blok',
      validation: (value) => !value?.trim() ? 'Nama blok wajib diisi' : value.length > 100 ? 'Maksimal 100 karakter' : null
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
      kodeBlok: selectedItem.kode_blok,
      namaBlok: selectedItem.nama_blok,
      idAfdeling: selectedItem.id_afdeling,
      luas: selectedItem.luas,
      isActive: selectedItem.is_active
    };
  }, [selectedItem, emptyInitialValues]);

  // Load afdelings for dropdown
  const loadAfdelings = async () => {
    try {
      const afdelingList = await masterDataService.getAfdelings(true);
      if (Array.isArray(afdelingList)) {
        setAfdelings(afdelingList.filter(a => a.is_active));
      }
    } catch (err) {
      console.error('Failed to load afdelings:', err);
    }
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!masterDataService) return;

      const bloks = await masterDataService.getBloks(false);
      if (Array.isArray(bloks)) {
        setData(bloks);
        setPagination({ page: 1, limit: 10, total: bloks.length, totalPages: Math.ceil(bloks.length / 10) });
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to load blok data');
    } finally {
      setLoading(false);
    }
  };

  // Handle create
  const handleCreate = async (formData) => {
    try {
      setFormError(null);
      if (!masterDataService) throw new Error('Service not available');

      const blokData = {
        idAfdeling: parseInt(formData.idAfdeling),
        kodeBlok: formData.kodeBlok,
        namaBlok: formData.namaBlok,
        luas: parseFloat(formData.luas) || 0
      };

      const createdBlok = await masterDataService.createBlok(blokData, user?.id);
      // Optimistic update
      addItem(createdBlok);
      closeModal('create');
      clearPKSMasterDataCache();
      // Reload data to get fresh list
      await loadData(pagination.page, search);
    } catch (err) {
      setFormError(err.message || 'Failed to create blok');
    }
  };

  // Handle update
  const handleUpdate = async (formData) => {
    try {
      if (!selectedItem?.id) {
        setFormError('No blok selected');
        return;
      }
      setFormError(null);
      if (!masterDataService) throw new Error('Service not available');

      const blokData = {
        namaBlok: formData.namaBlok,
        luas: parseFloat(formData.luas) || 0,
        isActive: !!formData.isActive
      };

      const updatedBlok = await masterDataService.updateBlok(selectedItem.id, blokData, user?.id);
      // Optimistic update
      updateItem(selectedItem.id, updatedBlok);
      closeModal('edit');
      clearPKSMasterDataCache();
    } catch (err) {
      setFormError(err.message || 'Failed to update blok');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      if (!selectedItem?.id) {
        setDeleteError('No blok selected');
        return;
      }
      setDeleteError(null);
      setLoading(true);
      if (!masterDataService) throw new Error('Service not available');

      await masterDataService.deleteBlok(selectedItem.id, user?.id);
      removeItem(selectedItem.id);
      closeModal('delete');
      clearPKSMasterDataCache();
      if (blokData.length === 1 && pagination.page > 1) {
        await loadData(pagination.page - 1, search);
      } else {
        await loadData(pagination.page, search);
      }
    } catch (err) {
      setDeleteError(typeof err === 'string' ? err : (err.message || 'Terjadi kesalahan saat menghapus blok'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAfdelings();
    loadData(pagination.page, search);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Kelola Blok</h2>
          <p className="text-sm text-gray-500">Master data blok untuk sistem penimbangan</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Blok
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      <DataTable
        data={blokData}
        columns={tableColumns}
        loading={loading}
        pagination={pagination}
        search={search}
        onSearchChange={(value) => { setSearch(value); loadData(); }}
        onPageChange={(page) => loadData()}
        onEdit={(item) => openModal('edit', item)}
        onDelete={(item) => openModal('delete', item)}
        selectable={false}
        actions={true}
      />

      <FormModal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        onSubmit={handleCreate}
        title="Tambah Blok Baru"
        description="Masukkan informasi blok yang akan ditambahkan"
        fields={formFields}
        initialValues={emptyInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Simpan Blok"
      />

      <FormModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        onSubmit={handleUpdate}
        title="Edit Blok"
        description="Perbarui informasi blok"
        fields={formFields}
        initialValues={editInitialValues}
        isLoading={loading}
        error={formError}
        submitButtonText="Update Blok"
      />

      <DeleteConfirmModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onConfirm={handleDelete}
        title="Hapus Blok"
        message="Apakah Anda yakin ingin menghapus blok ini? Tindakan ini tidak dapat dibatalkan."
        itemName={selectedItem?.nama_blok || selectedItem?.kode_blok}
        isLoading={loading}
        dangerous={true}
        error={deleteError}
      />
    </div>
  );
};

export default BlokTab;