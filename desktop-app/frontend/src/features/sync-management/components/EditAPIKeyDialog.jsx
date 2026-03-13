import React, { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  LinearProgress,
  InputAdornment,
} from '@mui/material'
import {
  Key as KeyIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { useAPIKeyStore } from '../store/useAPIKeyStore'

const EditAPIKeyDialog = ({
  open,
  apiKey,
  onClose,
  onUpdate,
  loading,
  error,
}) => {
  const {
    formData,
    validationErrors,
    updateFormData,
    validateForm
  } = useAPIKeyStore()

  useEffect(() => {
    if (open && apiKey) {
      updateFormData('name', apiKey.name || '')
      updateFormData('description', apiKey.description || '')
      updateFormData('serverUrl', apiKey.serverUrl || '')
    }
  }, [open, apiKey])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    updateFormData(field, value)
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors }
      delete newErrors[field]
      const { setValidationErrors } = useAPIKeyStore.getState()
      setValidationErrors(newErrors)
    }
  }

  const handleSubmit = () => {
    if (!apiKey) return

    // Validate form before submission (edit mode - no API key validation)
    if (validateForm(true)) {
      onUpdate?.(apiKey.id, formData)
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  const isFormValid = formData.name.trim() && formData.serverUrl.trim()

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {loading && <LinearProgress />}

      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" component="div">
            Edit API Key: {apiKey?.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* API Key Info */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>ID:</strong> {apiKey?.id}<br />
            <strong>Status:</strong> {apiKey?.isActive ? 'Aktif' : 'Nonaktif'}<br />
            <strong>Dibuat:</strong> {apiKey?.createdAt ? new Date(apiKey.createdAt).toLocaleString('id-ID') : '-'}
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Nama API Key */}
          <TextField
            fullWidth
            label="Nama API Key *"
            placeholder="Contoh: Server Utama Production"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!validationErrors?.name}
            helperText={validationErrors?.name || 'Nama unik untuk mengidentifikasi API key ini'}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Server URL */}
          <TextField
            fullWidth
            label="Server URL *"
            placeholder="https://api.mainserver.com"
            value={formData.serverUrl}
            onChange={handleChange('serverUrl')}
            error={!!validationErrors?.serverUrl}
            helperText={validationErrors?.serverUrl || 'URL server tujuan sinkronisasi'}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Deskripsi */}
          <TextField
            fullWidth
            label="Deskripsi"
            placeholder="Informasi tambahan tentang API key ini"
            value={formData.description}
            onChange={handleChange('description')}
            error={!!validationErrors?.description}
            helperText={validationErrors?.description || 'Opsional: Jelaskan kegunaan API key ini'}
            disabled={loading}
            multiline
            rows={3}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                  <DescriptionIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Security Notice */}
        <Alert
          severity="warning"
          sx={{ mt: 2 }}
          icon={<SecurityIcon />}
        >
          <Typography variant="body2">
            <strong>Penting:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>API Key tidak dapat diubah karena alasan keamanan</li>
              <li>Untuk mengganti API Key, Anda perlu membuat yang baru</li>
              <li>Hapus API Key lama setelah pembuatan yang baru</li>
            </ul>
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || loading}
          startIcon={<EditIcon />}
        >
          {loading ? 'Menyimpan...' : 'Update API Key'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditAPIKeyDialog