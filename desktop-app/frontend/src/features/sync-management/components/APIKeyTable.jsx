import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
  CloudSync as SyncIcon,
  Link as LinkIcon,
} from '@mui/icons-material'

const APIKeyTable = ({
  apiKeys = [],
  loading = false,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}) => {
  const columns = [
    {
      field: 'name',
      headerName: 'Nama API Key',
      width: 180,
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: 'Deskripsi',
      width: 200,
      flex: 1.5,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: params.value ? 'text.primary' : 'text.secondary',
            fontStyle: params.value ? 'normal' : 'italic'
          }}
        >
          {params.value || 'Tidak ada deskripsi'}
        </Typography>
      ),
    },
    {
      field: 'serverUrl',
      headerName: 'Server URL',
      width: 250,
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all'
            }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Aktif' : 'Nonaktif'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant="outlined"
          icon={params.value ? <SyncIcon /> : undefined}
        />
      ),
    },
    {
      field: 'creatorUser',
      headerName: 'Dibuat Oleh',
      width: 150,
      flex: 1,
      valueGetter: (value, row) => row?.creatorUser?.fullName || 'Unknown',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.creatorUser?.fullName || 'Unknown'}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Tanggal Dibuat',
      width: 150,
      valueFormatter: (value) => {
        return new Date(value).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      },
    },
    {
      field: 'updatedAt',
      headerName: 'Terakhir Diubah',
      width: 150,
      valueFormatter: (value) => {
        return new Date(value).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      },
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const apiKey = params.row

        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => onEdit?.(apiKey)}
                sx={{ color: 'warning.main' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {apiKey.isActive ? (
              <Tooltip title="Nonaktifkan">
                <IconButton
                  size="small"
                  onClick={() => onDeactivate?.(apiKey)}
                  sx={{ color: 'text.secondary' }}
                >
                  <DeactivateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Aktifkan">
                <IconButton
                  size="small"
                  onClick={() => onActivate?.(apiKey)}
                  sx={{ color: 'success.main' }}
                >
                  <ActivateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Hapus">
              <IconButton
                size="small"
                onClick={() => onDelete?.(apiKey)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      },
    },
  ]

  // DataGrid localization
  const localeText = {
    MuiTablePagination: {
      labelRowsPerPage: 'Baris per halaman:',
      labelDisplayedRows: ({ from, to, count }) =>
        `${from}-${to} dari ${count}`,
    },
    columnMenuLabel: 'Menu Kolom',
    columnMenuShowColumns: 'Tampilkan Kolom',
    columnMenuFilter: 'Filter',
    columnMenuHideColumn: 'Sembunyikan',
    columnMenuUnsort: 'Tidak Diurut',
    columnMenuSortAsc: 'Urut Naik',
    columnMenuSortDesc: 'Urut Turun',
    footerRowSelected: (count) => `${count} baris dipilih`,
    checkboxSelectionHeaderName: 'Pilih',
    checkboxSelectionSelectAllRows: 'Pilih semua',
    checkboxSelectionUnselectAllRows: 'Batalkan pilihan semua',
    checkboxSelectionSelectRow: 'Pilih baris',
    checkboxSelectionUnselectRow: 'Batalkan pilihan baris',
    columnsManagementSearchTitle: 'Cari',
    columnsManagementNoColumns: 'Tidak ada kolom',
    columnsManagementShowHideAllText: 'Tampilkan/Sembunyikan semua',
    columnsManagementReset: 'Reset',
    filterPanelAddFilter: 'Tambah filter',
    filterPanelDeleteIconLabel: 'Hapus',
    filterPanelLinkOperator: 'Operator logika',
    filterPanelOperators: 'Operator',
    filterPanelOperatorAnd: 'Dan',
    filterPanelOperatorOr: 'Atau',
    filterPanelColumns: 'Kolom',
    filterPanelInputLabel: 'Nilai',
    filterPanelInputPlaceholder: 'Filter nilai',
    // Filter operator labels
    filterOperatorContains: 'mengandung',
    filterOperatorEquals: 'sama dengan',
    filterOperatorStartsWith: 'dimulai dengan',
    filterOperatorEndsWith: 'diakhiri dengan',
    filterOperatorIs: 'adalah',
    filterOperatorNot: 'bukan',
    filterOperatorAfter: 'setelah',
    filterOperatorOnOrAfter: 'pada atau setelah',
    filterOperatorBefore: 'sebelum',
    filterOperatorOnOrBefore: 'pada atau sebelum',
    filterOperatorIsEmpty: 'kosong',
    filterOperatorIsNotEmpty: 'tidak kosong',
    filterOperatorIsAnyOf: 'salah satu dari',
  }

  return (
    <Box sx={{ height: 'clamp(400px, 52vh, 560px)', width: '100%', overflowX: 'auto' }}>
      <DataGrid
        rows={apiKeys}
        columns={columns}
        loading={loading}
        density="compact"
        disableRowSelectionOnClick
        disableColumnMenu={false}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
          sorting: {
            sortModel: [{ field: 'createdAt', sort: 'desc' }],
          },
        }}
        pageSizeOptions={[5, 10, 20, 50]}
        sx={{
          minWidth: 1080,
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'grey.50',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(224, 224, 224, 1)',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid rgba(224, 224, 224, 1)',
          },
        }}
        localeText={localeText}
        getRowId={(row) => row.id || row.ID}
      />
    </Box>
  )
}

export default APIKeyTable
