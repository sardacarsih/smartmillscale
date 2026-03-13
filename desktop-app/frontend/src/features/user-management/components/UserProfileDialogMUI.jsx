import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Avatar,
  Chip,
} from '@mui/material'
import { AccountCircle as AccountIcon } from '@mui/icons-material'

const UserProfileDialogMUI = ({ open, onClose, onUpdate, currentUser, loading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
      })
      setErrors({})
    }
  }, [currentUser])

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.fullName || formData.fullName.trim() === '') {
      newErrors.fullName = 'Nama lengkap harus diisi'
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Format email tidak valid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validate() && onUpdate) {
      const success = await onUpdate(formData.fullName, formData.email)
      if (success) {
        onClose()
      }
    }
  }

  const handleCancel = () => {
    setErrors({})
    onClose()
  }

  if (!currentUser) return null

  return (
    <Dialog open={open} onClose={loading ? undefined : handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountIcon />
        Profil Saya
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent>
        {/* User Info Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            p: 2,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            {currentUser.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{currentUser.username}</Typography>
            <Chip label={currentUser.role} size="small" color="primary" />
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Anda hanya dapat mengubah nama dan email. Untuk mengganti password, gunakan menu "Ganti Password".
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Username"
            value={currentUser.username}
            disabled
            fullWidth
            helperText="Username tidak dapat diubah"
          />

          <TextField
            label="Nama Lengkap"
            value={formData.fullName}
            onChange={handleChange('fullName')}
            error={!!errors.fullName}
            helperText={errors.fullName}
            fullWidth
            required
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
          />

          <TextField
            label="Role"
            value={currentUser.role}
            disabled
            fullWidth
            helperText="Role ditentukan oleh administrator"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} disabled={loading}>
          Batal
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Simpan Perubahan
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserProfileDialogMUI
