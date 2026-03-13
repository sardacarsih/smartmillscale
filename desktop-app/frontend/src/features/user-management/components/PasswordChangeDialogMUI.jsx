import React, { useState } from 'react'
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
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  VpnKey as KeyIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
} from '@mui/icons-material'

const PasswordChangeDialogMUI = ({ open, onClose, onChangePassword, loading }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] })
  }

  // Password strength validation
  const getPasswordStrength = () => {
    const password = formData.newPassword
    const checks = {
      length: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password),
    }
    return checks
  }

  const passwordStrength = getPasswordStrength()

  const validate = () => {
    const newErrors = {}

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Password lama harus diisi'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password baru harus diisi'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password minimal 8 karakter'
    } else if (!passwordStrength.hasLetter) {
      newErrors.newPassword = 'Password harus mengandung minimal 1 huruf'
    } else if (!passwordStrength.hasNumber) {
      newErrors.newPassword = 'Password harus mengandung minimal 1 angka'
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok'
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = 'Password baru harus berbeda dari password lama'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validate() && onChangePassword) {
      const success = await onChangePassword(formData.oldPassword, formData.newPassword)
      if (success) {
        handleReset()
      }
    }
  }

  const handleReset = () => {
    setFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setErrors({})
    setShowPasswords({ old: false, new: false, confirm: false })
    onClose()
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : handleReset} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyIcon />
        Ganti Password
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
          Pastikan Anda mengingat password baru. Anda akan diminta login ulang setelah mengganti password.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Password Lama"
            type={showPasswords.old ? 'text' : 'password'}
            value={formData.oldPassword}
            onChange={handleChange('oldPassword')}
            error={!!errors.oldPassword}
            helperText={errors.oldPassword}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('old')} edge="end">
                    {showPasswords.old ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Password Baru"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange('newPassword')}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('new')} edge="end">
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {formData.newPassword && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Kekuatan Password:
              </Typography>
              <List dense>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.length ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      <Cancel color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary="Minimal 8 karakter" />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.hasLetter ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      <Cancel color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary="Mengandung huruf" />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.hasNumber ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      <Cancel color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary="Mengandung angka" />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.hasSpecial ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      <Cancel color="disabled" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Mengandung karakter spesial (opsional)"
                    secondary="Untuk keamanan lebih baik"
                  />
                </ListItem>
              </List>
            </Box>
          )}

          <TextField
            label="Konfirmasi Password Baru"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('confirm')} edge="end">
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleReset} disabled={loading}>
          Batal
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Ganti Password
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PasswordChangeDialogMUI
