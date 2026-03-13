import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Chip, IconButton, Tooltip } from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material'

const UserDataGrid = ({
  users = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  onResetPassword,
  selectedUsers = [],
  onSelectionChange,
}) => {
  const columns = [
    {
      field: 'username',
      headerName: 'Username',
      width: 150,
      flex: 1,
    },
    {
      field: 'fullName',
      headerName: 'Nama Lengkap',
      width: 200,
      flex: 1.5,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      flex: 1.5,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 130,
      renderCell: (params) => {
        const roleColors = {
          ADMIN: 'error',
          SUPERVISOR: 'warning',
          TIMBANGAN: 'info',
          GRADING: 'success',
        }

        return (
          <Chip
            label={params.value}
            color={roleColors[params.value] || 'default'}
            size="small"
            variant="filled"
          />
        )
      },
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
        />
      ),
    },
    {
      field: 'mustChangePassword',
      headerName: 'Ganti PW',
      width: 100,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Ya" color="warning" size="small" variant="outlined" />
        ) : null,
    },
    {
      field: 'createdAt',
      headerName: 'Dibuat',
      width: 150,
      valueFormatter: (params) => {
        return new Date(params).toLocaleDateString('id-ID')
      },
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Lihat Detail">
            <IconButton
              size="small"
              onClick={() => onView(params.row)}
              color="info"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => onEdit(params.row)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset Password">
            <IconButton
              size="small"
              onClick={() => onResetPassword(params.row)}
              color="warning"
            >
              <KeyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Hapus">
            <IconButton
              size="small"
              onClick={() => onDelete(params.row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={Array.isArray(users) ? users : []}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id || row.ID || Math.random().toString(36)}
        checkboxSelection
        disableRowSelectionOnClick
        pagination
        initialState={{
          pagination: {
            paginationModel: { pageSize: 20, page: 0 },
          },
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        onRowSelectionModelChange={(newSelection) => {
          if (onSelectionChange && Array.isArray(newSelection)) {
            onSelectionChange(newSelection)
          }
        }}
        rowSelectionModel={Array.isArray(selectedUsers) ? selectedUsers : []}
        sx={{
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
          '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.25)',
            },
          },
        }}
      />
    </Box>
  )
}

export default UserDataGrid
