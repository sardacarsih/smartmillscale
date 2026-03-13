import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import {
  Box,
  Container,
  Typography,
  Button,
  Fab,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Key as KeyIcon,
  CloudSync as SyncIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

import { useAPIKeyStore } from '../store/useAPIKeyStore'
import APIKeyTable from '../components/APIKeyTable'
import CreateAPIKeyDialog from '../components/CreateAPIKeyDialog'
import EditAPIKeyDialog from '../components/EditAPIKeyDialog'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import userManagementTheme from '../../user-management/theme'
import { Topbar } from '../../../shared'
import { getWailsWrapper } from '../../../shared/lib/wailsWrapper'

const APIKeyManagementPage = ({ currentUser, wails: wailsProp, onNavigate, onLogout }) => {
  const wails = wailsProp || getWailsWrapper(true)

  const {
    apiKeys,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isActivating,
    error,
    successMessage,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    selectedAPIKey,
    formData,
    validationErrors,
    searchQuery,
    filterStatus,
    getFilteredAPIKeys,
    setLoading,
    setCreating,
    setUpdating,
    setDeleting,
    setActivating,
    setError,
    setSuccessMessage,
    clearMessages,
    showCreateDialog,
    hideCreateDialog,
    showEditDialog,
    hideEditDialog,
    showDeleteDialog,
    hideDeleteDialog,
    updateFormData,
    resetFormData,
    setValidationErrors,
    validateForm,
    setAPIKeys,
    updateAPIKey,
    removeAPIKey,
    setSearchQuery,
    setFilterStatus,
  } = useAPIKeyStore()

  // Load API keys on mount
  useEffect(() => {
    if (wails) {
      loadAPIKeys()
    }
  }, [wails])

  // Load API keys from backend
  const loadAPIKeys = async () => {
    console.log('🔍 [APIKeyManagement] Starting loadAPIKeys...')
    setLoading(true)
    clearMessages()

    try {
      console.log('📡 [APIKeyManagement] Calling wails.GetAPIKeys()...')
      const response = await wails.GetAPIKeys()
      console.log('📥 [APIKeyManagement] GetAPIKeys response:', response)

      const result = JSON.parse(response)
      console.log('📊 [APIKeyManagement] Parsed result:', result)

      if (result.success) {
        // Normalize PascalCase keys from Go backend to camelCase for frontend
        const normalized = (result.data || []).map(key => ({
          id: key.ID || key.id,
          name: key.Name || key.name || '',
          key: key.Key || key.key || '',
          description: key.Description || key.description || '',
          serverUrl: key.ServerURL || key.serverUrl || '',
          isActive: key.IsActive !== undefined ? key.IsActive : key.isActive,
          createdBy: key.CreatedBy || key.createdBy || '',
          creatorUser: key.CreatorUser || key.creatorUser || null,
          createdAt: key.CreatedAt || key.createdAt || '',
          updatedAt: key.UpdatedAt || key.updatedAt || '',
          lastUsedAt: key.LastUsedAt || key.lastUsedAt || null,
        }))
        console.log('✅ [APIKeyManagement] Setting API keys:', normalized)
        setAPIKeys(normalized)
      } else {
        console.log('❌ [APIKeyManagement] API returned error:', result.message)
        setError(result.message || 'Gagal memuat API keys')
      }
    } catch (err) {
      console.error('💥 [APIKeyManagement] Error loading API keys:', err)
      setError('Terjadi kesalahan saat memuat API keys')
    } finally {
      setLoading(false)
    }
  }

  // Create API key
  const handleCreateAPIKey = async (data) => {
    // Validate form
    if (!validateForm(false)) {
      return
    }

    setCreating(true)
    clearMessages()

    try {
      const response = await wails.CreateAPIKey(JSON.stringify(data), currentUser.id)
      const result = JSON.parse(response)

      if (result.success) {
        setSuccessMessage('API key berhasil dibuat')
        hideCreateDialog()
        resetFormData()
        await loadAPIKeys() // Refresh list
      } else {
        setError(result.message || 'Gagal membuat API key')
      }
    } catch (err) {
      console.error('Error creating API key:', err)
      setError('Terjadi kesalahan saat membuat API key')
    } finally {
      setCreating(false)
    }
  }

  // Update API key
  const handleUpdateAPIKey = async (id, data) => {
    // Validate form
    if (!validateForm(true)) {
      return
    }

    setActivating(true)
    clearMessages()

    try {
      const response = await wails.UpdateAPIKey(JSON.stringify({ ...data, id }), currentUser.id)
      const result = JSON.parse(response)

      if (result.success) {
        setSuccessMessage('API key berhasil diperbarui')
        hideEditDialog()
        await loadAPIKeys() // Refresh list
      } else {
        setError(result.message || 'Gagal memperbarui API key')
      }
    } catch (err) {
      console.error('Error updating API key:', err)
      setError('Terjadi kesalahan saat memperbarui API key')
    } finally {
      setActivating(false)
    }
  }

  // Delete API key
  const handleDeleteAPIKey = async (id) => {
    setDeleting(true)
    clearMessages()

    try {
      const response = await wails.DeleteAPIKey(id, currentUser.id)
      const result = JSON.parse(response)

      if (result.success) {
        setSuccessMessage('API key berhasil dihapus')
        hideDeleteDialog()
        await loadAPIKeys() // Refresh list
      } else {
        setError(result.message || 'Gagal menghapus API key')
      }
    } catch (err) {
      console.error('Error deleting API key:', err)
      setError('Terjadi kesalahan saat menghapus API key')
    } finally {
      setDeleting(false)
    }
  }

  // Activate/Deactivate API key
  const handleToggleActivation = async (apiKey) => {
    setActivating(true)
    clearMessages()

    try {
      const response = apiKey.isActive
        ? await wails.DeactivateAPIKey(apiKey.id, currentUser.id)
        : await wails.ReactivateAPIKey(apiKey.id, currentUser.id)

      const result = JSON.parse(response)

      if (result.success) {
        setSuccessMessage(
          apiKey.isActive ? 'API key berhasil dinonaktifkan' : 'API key berhasil diaktifkan'
        )
        await loadAPIKeys() // Refresh list
      } else {
        setError(result.message || 'Gagal mengubah status API key')
      }
    } catch (err) {
      console.error('Error toggling API key activation:', err)
      setError('Terjadi kesalahan saat mengubah status API key')
    } finally {
      setActivating(false)
    }
  }

  // Handlers
  const handleRefresh = () => {
    loadAPIKeys()
  }

  const handleEdit = (apiKey) => {
    showEditDialog(apiKey)
  }

  const handleDelete = (apiKey) => {
    showDeleteDialog(apiKey)
  }

  const handleActivate = (apiKey) => {
    handleToggleActivation(apiKey)
  }

  const handleDeactivate = (apiKey) => {
    handleToggleActivation(apiKey)
  }

  // Get filtered data
  const filteredAPIKeys = getFilteredAPIKeys()

  // Statistics
  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(key => key.isActive).length,
    inactive: apiKeys.filter(key => !key.isActive).length,
  }

  // Require Wails
  if (!wails) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#111827' }}>
        <Alert severity="error">
          <Typography variant="h6">Wails Environment Required</Typography>
          <Typography variant="body2">Please run this application using: wails dev</Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <ThemeProvider theme={userManagementTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#111827' }}>
        {/* Topbar */}
        <Topbar
          currentUser={currentUser}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <KeyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Manajemen API Key
                </Typography>
                <Typography variant="body2" sx={{ color: 'gray.400' }}>
                  Kelola API key untuk sinkronisasi dengan server utama
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <KeyIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6">{stats.total}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total API Keys
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SyncIcon sx={{ fontSize: 24, color: 'success.main' }} />
                    <Box>
                      <Typography variant="h6">{stats.active}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        API Keys Aktif
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SecurityIcon sx={{ fontSize: 24, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="h6">{stats.inactive}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        API Keys Nonaktif
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters and Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Cari berdasarkan nama, deskripsi, atau server URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Status Filter"
                    >
                      <MenuItem value="all">Semua Status</MenuItem>
                      <MenuItem value="active">Aktif</MenuItem>
                      <MenuItem value="inactive">Nonaktif</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      {filteredAPIKeys.length} dari {apiKeys.length} API keys
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* API Keys Table */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <APIKeyTable
                apiKeys={filteredAPIKeys}
                loading={isLoading || isActivating}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
              />
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert
            severity="info"
            sx={{ mt: 2 }}
            icon={<InfoIcon />}
          >
            <Typography variant="body2">
              <strong>Tips:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Gunakan nama yang deskriptif untuk memudahkan identifikasi API key</li>
                <li>Nonaktifkan API key yang tidak digunakan untuk keamanan</li>
                <li>Pastikan server URL sudah benar sebelum membuat API key</li>
                <li>API key disimpan secara terenkripsi untuk keamanan</li>
              </ul>
            </Typography>
          </Alert>
        </Container>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={showCreateDialog}
          disabled={isCreating}
        >
          <AddIcon />
        </Fab>

        {/* Create Dialog */}
        <CreateAPIKeyDialog
          open={showCreateModal}
          onClose={hideCreateDialog}
          onCreate={handleCreateAPIKey}
          loading={isCreating}
          error={error}
        />

        {/* Edit Dialog */}
        <EditAPIKeyDialog
          open={showEditModal}
          apiKey={selectedAPIKey}
          onClose={hideEditDialog}
          onUpdate={handleUpdateAPIKey}
          loading={isActivating}
          error={error}
        />

        {/* Delete Dialog */}
        <DeleteConfirmModal
          open={showDeleteModal}
          apiKey={selectedAPIKey}
          onClose={hideDeleteDialog}
          onConfirm={handleDeleteAPIKey}
          loading={isDeleting}
        />

        {/* Success/Error Messages */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage(null)}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

export default APIKeyManagementPage