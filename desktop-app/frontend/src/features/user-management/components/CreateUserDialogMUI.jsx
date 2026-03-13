import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Step,
  Stepper,
  StepLabel,
  Typography,
  Alert,
  LinearProgress,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material'

const steps = ['Informasi Dasar', 'Kredensial', 'Review']

const CreateUserDialogMUI = ({ open, onClose, onCreate, loading }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'TIMBANGAN',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'TIMBANGAN', label: 'Timbangan' },
    { value: 'GRADING', label: 'Grading' },
  ]

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 0) {
      if (!formData.username) newErrors.username = 'Username harus diisi'
      if (!formData.fullName) newErrors.fullName = 'Nama lengkap harus diisi'
    } else if (step === 1) {
      if (!formData.password) newErrors.password = 'Password harus diisi'
      if (formData.password && formData.password.length < 8)
        newErrors.password = 'Password minimal 8 karakter'
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = 'Password tidak cocok'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        handleSubmit()
      } else {
        setActiveStep((prev) => prev + 1)
      }
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    if (onCreate) {
      const success = await onCreate(formData)
      if (success) {
        handleReset()
      }
    }
  }

  const handleReset = () => {
    setFormData({
      username: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'TIMBANGAN',
    })
    setActiveStep(0)
    setErrors({})
    onClose()
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={handleChange('username')}
              error={!!errors.username}
              helperText={errors.username}
              fullWidth
              required
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
          </Box>
        )
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              error={!!errors.password}
              helperText={errors.password || 'Minimal 8 karakter'}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Konfirmasi Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              fullWidth
              required
            />
          </Box>
        )
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Mohon periksa kembali data user sebelum menyimpan
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2">
                <strong>Username:</strong> {formData.username}
              </Typography>
              <Typography variant="body2">
                <strong>Nama Lengkap:</strong> {formData.fullName}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {formData.email || '-'}
              </Typography>
              <Typography variant="body2">
                <strong>Role:</strong> {formData.role}
              </Typography>
            </Box>
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleReset}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAddIcon />
        Buat User Baru
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleReset} disabled={loading}>
          Batal
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Kembali
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading}
        >
          {activeStep === steps.length - 1 ? 'Simpan' : 'Lanjut'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateUserDialogMUI
