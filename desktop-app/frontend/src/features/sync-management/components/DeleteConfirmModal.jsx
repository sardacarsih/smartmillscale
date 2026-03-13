import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material'

const DeleteConfirmModal = ({
  open,
  apiKey,
  onClose,
  onConfirm,
  loading,
}) => {
  const handleConfirm = () => {
    if (!apiKey) return
    onConfirm?.(apiKey.id)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('id-ID')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {loading && <LinearProgress />}

      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" component="div">
            Hapus API Key
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Anda yakin ingin menghapus API Key ini? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
          </Typography>
        </Alert>

        {apiKey && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* API Key Details */}
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'grey.50'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <KeyIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary">
                  Informasi API Key
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                    Nama:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {apiKey.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                    Status:
                  </Typography>
                  <Chip
                    label={apiKey.isActive ? 'Aktif' : 'Nonaktif'}
                    color={apiKey.isActive ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {apiKey.description && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                      Deskripsi:
                    </Typography>
                    <Typography variant="body2">
                      {apiKey.description}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                    Server URL:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      wordBreak: 'break-all'
                    }}
                  >
                    {apiKey.serverUrl}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Timestamps */}
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'grey.50'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary">
                  Timeline
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    Dibuat:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(apiKey.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    Diubah:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(apiKey.updatedAt)}
                  </Typography>
                </Box>

                {apiKey.creatorUser && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" sx={{ fontSize: 14 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                      Pembuat:
                    </Typography>
                    <Typography variant="body2">
                      {apiKey.creatorUser.fullName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Warning Box */}
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ mt: 1 }}
            >
              <Typography variant="body2">
                <strong>Peringatan:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Semua data API Key akan dihapus secara permanen</li>
                  <li>API Key ini tidak dapat dipulihkan setelah dihapus</li>
                  <li>Sinkronisasi dengan server ini akan berhenti berfungsi</li>
                  <li>Pastikan tidak ada proses aktif yang menggunakan API Key ini</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
        >
          Batal
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading || !apiKey}
          startIcon={<DeleteIcon />}
        >
          {loading ? 'Menghapus...' : 'Hapus API Key'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmModal