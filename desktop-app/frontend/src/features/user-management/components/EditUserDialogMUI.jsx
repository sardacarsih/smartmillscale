import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  LinearProgress,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material'
import { Edit as EditIcon } from '@mui/icons-material'

const EditUserDialogMUI = ({ open, onClose, onUpdate, user, loading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'TIMBANGAN',
    isActive: true,
  })
  const [errors, setErrors] = useState({})

  const roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'TIMBANGAN', label: 'Timbangan' },
    { value: 'GRADING', label: 'Grading' },
  ]

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || 'TIMBANGAN',
        isActive: user.isActive ?? true,
      })
      setErrors({})
    }
  }, [user])

  const handleChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value
    setFormData({ ...formData, [field]: value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.fullName) {
      newErrors.fullName = 'Nama lengkap harus diisi'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validate() && onUpdate && user) {
      const success = await onUpdate(user.id, formData)
      if (success) {
        onClose()
      }
    }
  }

  const handleCancel = () => {
    setErrors({})
    onClose()
  }

  if (!user) return null

  return (
    <Dialog open={open} onClose={loading ? undefined : handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditIcon />
        Edit User: {user.username}
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent>
        <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
          Perubahan akan langsung tersimpan setelah klik Simpan
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Username"
            value={user.username}
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
            select
            label="Role"
            value={formData.role}
            onChange={handleChange('role')}
            fullWidth
            required
          >
            {roles.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleChange('isActive')}
                color="success"
              />
            }
            label={
              <Typography variant="body2">
                Status: {formData.isActive ? 'Aktif' : 'Nonaktif'}
              </Typography>
            }
          />

          {user.mustChangePassword && (
            <Alert severity="warning">
              User ini harus mengganti password saat login berikutnya
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} disabled={loading}>
          Batal
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditUserDialogMUI
