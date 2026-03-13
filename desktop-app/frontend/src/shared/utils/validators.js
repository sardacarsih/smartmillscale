/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Must contain: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password minimal 8 karakter',
    }
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password harus mengandung minimal 1 huruf besar',
    }
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password harus mengandung minimal 1 huruf kecil',
    }
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password harus mengandung minimal 1 angka',
    }
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: 'Password harus mengandung minimal 1 karakter spesial',
    }
  }

  return {
    isValid: true,
    message: 'Password valid',
  }
}

/**
 * Validate username format
 * Must be alphanumeric with underscores, 3-20 characters
 * @param {string} username - Username to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateUsername = (username) => {
  if (!username || username.length < 3) {
    return {
      isValid: false,
      message: 'Username minimal 3 karakter',
    }
  }

  if (username.length > 20) {
    return {
      isValid: false,
      message: 'Username maksimal 20 karakter',
    }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      message: 'Username hanya boleh mengandung huruf, angka, dan underscore',
    }
  }

  return {
    isValid: true,
    message: 'Username valid',
  }
}

/**
 * Validate vehicle number format
 * @param {string} vehicleNumber - Vehicle number to validate
 * @returns {boolean}
 */
export const isValidVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber || vehicleNumber.trim().length === 0) {
    return false
  }

  // Basic validation - can be customized based on actual vehicle number format
  return vehicleNumber.trim().length >= 3
}

/**
 * Validate weight value
 * @param {number} weight - Weight value to validate
 * @returns {object} { isValid: boolean, message: string }
 */
export const validateWeight = (weight) => {
  if (weight === null || weight === undefined || weight === '') {
    return {
      isValid: false,
      message: 'Berat tidak boleh kosong',
    }
  }

  const numWeight = Number(weight)

  if (isNaN(numWeight)) {
    return {
      isValid: false,
      message: 'Berat harus berupa angka',
    }
  }

  if (numWeight <= 0) {
    return {
      isValid: false,
      message: 'Berat harus lebih besar dari 0',
    }
  }

  if (numWeight > 1000000) {
    return {
      isValid: false,
      message: 'Berat terlalu besar',
    }
  }

  return {
    isValid: true,
    message: 'Berat valid',
  }
}
