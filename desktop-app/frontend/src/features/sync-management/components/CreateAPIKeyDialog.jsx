import React from 'react'
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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Key as KeyIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useAPIKeyStore } from '../store/useAPIKeyStore'

const CreateAPIKeyDialog = ({
  open,
  onClose,
  onCreate,
  loading,
  error,
}) => {
  const [showApiKey, setShowApiKey] = React.useState(false)

  const {
    formData,
    validationErrors,
    updateFormData,
    resetFormData,
    clearValidationErrors,
    validateForm
  } = useAPIKeyStore()

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
    // Validate form before submission
    if (validateForm(false)) {
      onCreate?.(formData)
    }
  }

  const handleClose = () => {
    resetFormData()
    setShowApiKey(false)
    onClose?.()
  }

  const isFormValid = formData.name.trim() &&
                     formData.apiKey.trim() &&
                     formData.serverUrl.trim()

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {loading && <LinearProgress />}

      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyIcon color="primary" />
          <Typography variant="h6" component="div">
            Tambah API Key Baru
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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

          {/* API Key */}
          <TextField
            fullWidth
            label="API Key *"
            placeholder="Masukkan API key dari server utama"
            value={formData.apiKey}
            onChange={handleChange('apiKey')}
            error={!!validationErrors?.apiKey}
            helperText={validationErrors?.apiKey || 'API key yang diterima dari server utama'}
            disabled={loading}
            type={showApiKey ? 'text' : 'password'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                    disabled={loading}
                  >
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
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

        {/* Info Box */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Catatan:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>API key akan disimpan secara terenkripsi</li>
              <li>Nama API key harus unik</li>
              <li>Server URL harus dimulai dengan http:// atau https://</li>
              <li>API key minimal 10 karakter</li>
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
          startIcon={<SaveIcon />}
        >
          {loading ? 'Menyimpan...' : 'Simpan API Key'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateAPIKeyDialog