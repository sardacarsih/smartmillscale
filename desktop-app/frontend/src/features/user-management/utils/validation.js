// Validation utilities for user management

export const validateUsername = (username) => {
  const errors = []

  if (!username || username.trim() === '') {
    errors.push('Username harus diisi')
  } else {
    if (username.length < 3) {
      errors.push('Username minimal 3 karakter')
    }
    if (username.length > 50) {
      errors.push('Username maksimal 50 karakter')
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username hanya boleh mengandung huruf, angka, underscore, dan dash')
    }
    if (!/^[a-zA-Z]/.test(username)) {
      errors.push('Username harus dimulai dengan huruf')
    }
  }

  return errors
}

export const validateFullName = (fullName) => {
  const errors = []

  if (!fullName || fullName.trim() === '') {
    errors.push('Nama lengkap harus diisi')
  } else {
    if (fullName.length < 2) {
      errors.push('Nama lengkap minimal 2 karakter')
    }
    if (fullName.length > 100) {
      errors.push('Nama lengkap maksimal 100 karakter')
    }
    if (!/^[a-zA-Z\s.,'-]+$/.test(fullName)) {
      errors.push('Nama lengkap hanya boleh mengandung huruf, spasi, dan karakter titik, koma, apostrof, dan dash')
    }
  }

  return errors
}

export const validateEmail = (email) => {
  const errors = []

  if (email && email.trim() !== '') {
    if (email.length > 100) {
      errors.push('Email maksimal 100 karakter')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('Format email tidak valid')
    }
  }

  return errors
}

export const validatePassword = (password, confirmPassword = null) => {
  const errors = []

  if (!password || password.trim() === '') {
    errors.push('Password harus diisi')
  } else {
    if (password.length < 6) {
      errors.push('Password minimal 6 karakter')
    }
    if (password.length > 255) {
      errors.push('Password maksimal 255 karakter')
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password harus mengandung huruf kecil')
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password harus mengandung huruf besar')
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password harus mengandung angka')
    }
    // Check for common weak patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password tidak boleh mengandung karakter yang berulang lebih dari 2 kali')
    }
    if (password.toLowerCase().includes('password') ||
        password.toLowerCase().includes('123456') ||
        password.toLowerCase().includes('qwerty')) {
      errors.push('Password terlalu umum, gunakan password yang lebih unik')
    }
  }

  if (confirmPassword !== null) {
    if (password !== confirmPassword) {
      errors.push('Konfirmasi password tidak cocok')
    }
  }

  return errors
}

export const validateRole = (role) => {
  const errors = []
  const validRoles = ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING']

  if (!role || role.trim() === '') {
    errors.push('Role harus dipilih')
  } else if (!validRoles.includes(role)) {
    errors.push('Role tidak valid')
  }

  return errors
}

export const validateUserUpdate = (userData) => {
  const errors = {}

  // Full name validation
  const fullNameErrors = validateFullName(userData.fullName)
  if (fullNameErrors.length > 0) {
    errors.fullName = fullNameErrors
  }

  // Email validation (optional)
  const emailErrors = validateEmail(userData.email)
  if (emailErrors.length > 0) {
    errors.email = emailErrors
  }

  // Role validation
  const roleErrors = validateRole(userData.role)
  if (roleErrors.length > 0) {
    errors.role = roleErrors
  }

  return errors
}

export const validateUserCreation = (userData) => {
  const errors = {}

  // Username validation
  const usernameErrors = validateUsername(userData.username)
  if (usernameErrors.length > 0) {
    errors.username = usernameErrors
  }

  // Full name validation
  const fullNameErrors = validateFullName(userData.fullName)
  if (fullNameErrors.length > 0) {
    errors.fullName = fullNameErrors
  }

  // Email validation (optional)
  const emailErrors = validateEmail(userData.email)
  if (emailErrors.length > 0) {
    errors.email = emailErrors
  }

  // Password validation
  const passwordErrors = validatePassword(userData.password, userData.confirmPassword)
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors
  }

  // Role validation
  const roleErrors = validateRole(userData.role)
  if (roleErrors.length > 0) {
    errors.role = roleErrors
  }

  return errors
}

export const validateBulkUpdate = (updates) => {
  const errors = []

  // Check if at least one field is being updated
  const updateFields = Object.keys(updates)
  if (updateFields.length === 0) {
    errors.push('Pilih setidaknya satu field untuk diupdate')
    return { isValid: false, errors }
  }

  // Validate each field
  const validFields = ['role', 'is_active', 'must_change_password']
  const invalidFields = updateFields.filter(field => !validFields.includes(field))
  if (invalidFields.length > 0) {
    errors.push(`Field tidak valid: ${invalidFields.join(', ')}`)
  }

  // Validate role if provided
  if (updates.role) {
    const roleErrors = validateRole(updates.role)
    if (roleErrors.length > 0) {
      errors.push(...roleErrors)
    }
  }

  // Validate is_active if provided
  if (updates.is_active !== undefined && typeof updates.is_active !== 'boolean') {
    errors.push('Status aktif harus berupa boolean (true/false)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Password strength calculator
export const calculatePasswordStrength = (password) => {
  if (!password) return 0

  let strength = 0

  // Length bonus
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (password.length >= 16) strength++

  // Character variety bonus
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++

  // Complexity bonus
  if (/(.)\1{2,}/.test(password)) strength-- // Penalty for repeated characters
  if (/^[a-zA-Z]+$/.test(password)) strength-- // Penalty for letters only
  if (/^\d+$/.test(password)) strength-- // Penalty for numbers only

  return Math.max(0, Math.min(5, strength))
}

export const getPasswordStrengthLabel = (strength) => {
  const labels = {
    0: 'Sangat Lemah',
    1: 'Sangat Lemah',
    2: 'Lemah',
    3: 'Sedang',
    4: 'Kuat',
    5: 'Sangat Kuat'
  }

  return labels[strength] || 'Sangat Lemah'
}

export const getPasswordStrengthColor = (strength) => {
  const colors = {
    0: 'text-red-500',
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-green-500',
    5: 'text-green-500'
  }

  return colors[strength] || 'text-red-500'
}

// Format error messages for display
export const formatValidationErrors = (errors) => {
  const formattedErrors = {}

  Object.keys(errors).forEach(field => {
    const fieldErrors = errors[field]
    if (Array.isArray(fieldErrors)) {
      formattedErrors[field] = fieldErrors.join(', ')
    } else {
      formattedErrors[field] = fieldErrors
    }
  })

  return formattedErrors
}

// Check if user data has changes
export const hasUserChanges = (originalData, newData) => {
  const fieldsToCheck = ['fullName', 'email', 'role', 'isActive']

  return fieldsToCheck.some(field => {
    if (field === 'isActive') {
      return originalData[field] !== (newData[field] === 'true' || newData[field] === true)
    }
    return originalData[field] !== newData[field]
  })
}

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove potential JavaScript URLs
    .replace(/on\w+=/gi, '') // Remove potential event handlers
}

// Generate password suggestions
export const generatePasswordSuggestion = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''

  // Ensure at least one of each character type
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}