import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Settings, User, Building, MapPin, Mail, Lock, Shield, ArrowRight, ArrowLeft } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'

const SetupWizard = ({ onSetupComplete, wailsBinding }) => {
  const {
    completeSetup,
    createDefaultUser,
    isLoading,
    error,
    notification,
    clearNotification,
    clearError
  } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    companyName: '',
    location: ''
  })
  const [validationErrors, setValidationErrors] = useState({})

  const steps = [
    {
      id: 'welcome',
      title: 'Selamat Datang',
      description: 'Mari konfigurasi Smart Mill Scale Anda',
      icon: Settings
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Buat akun administrator sistem',
      icon: Shield
    },
    {
      id: 'company',
      title: 'Informasi Perusahaan',
      description: 'Tambahkan detail perusahaan Anda',
      icon: Building
    },
    {
      id: 'complete',
      title: 'Selesai',
      description: 'Setup awal telah selesai',
      icon: CheckCircle
    }
  ]

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Clear global error when user starts typing
    if (error) {
      clearError()
    }
  }

  // Validate current step
  const validateStep = () => {
    const errors = {}

    switch (currentStep) {
      case 1: // Admin step
        if (!formData.username.trim()) {
          errors.username = 'Username harus diisi'
        } else if (formData.username.length < 3) {
          errors.username = 'Username minimal 3 karakter'
        }

        if (!formData.password) {
          errors.password = 'Password harus diisi'
        } else if (formData.password.length < 8) {
          errors.password = 'Password minimal 8 karakter'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
          errors.password = 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial'
        }

        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Konfirmasi password tidak cocok'
        }

        if (!formData.email.trim()) {
          errors.email = 'Email harus diisi'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Format email tidak valid'
        }

        if (!formData.fullName.trim()) {
          errors.fullName = 'Nama lengkap harus diisi'
        }
        break

      case 2: // Company step
        if (!formData.companyName.trim()) {
          errors.companyName = 'Nama perusahaan harus diisi'
        }
        if (!formData.location.trim()) {
          errors.location = 'Lokasi harus diisi'
        }
        break

      default:
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle next step
  const handleNext = () => {
    if (currentStep === 3) { // Complete step
      handleCompleteSetup()
      return
    }

    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
    setValidationErrors({})
  }

  // Handle complete setup
  const handleCompleteSetup = async () => {
    if (!validateStep()) {
      return
    }

    const setupData = {
      username: formData.username.trim(),
      password: formData.password,
      email: formData.email.trim(),
      fullName: formData.fullName.trim(),
      companyName: formData.companyName.trim(),
      location: formData.location.trim()
    }

    const success = await completeSetup(wailsBinding?.CompleteSetup, setupData)

    if (success && onSetupComplete) {
      // Move to complete step
      setCurrentStep(3)
    }
  }

  // Handle use default credentials
  const handleUseDefaultCredentials = async () => {
    const success = await createDefaultUser(wailsBinding?.CreateDefaultUser)

    if (success && onSetupComplete) {
      // Move to complete step
      setCurrentStep(3)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && currentStep < 3) {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, formData])

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
      </div>

      {/* Setup Container */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep
              const StepIcon = step.icon

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted ? 'bg-green-600 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-sm font-medium ${isCompleted || isCurrent ? 'text-white' : 'text-gray-400'}`}>
                        {step.title}
                      </p>
                      <p className={`text-xs ${isCompleted || isCurrent ? 'text-gray-300' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-full sm:w-20 h-0.5 mx-4 transition-colors duration-300
                      ${index < currentStep ? 'bg-green-600' : 'bg-gray-700'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Setup Content */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Step Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <currentStepData.icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-300">
              {currentStepData.description}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">Setup Gagal</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 0 && (
              <div className="text-center space-y-4">
                <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Selamat Datang di Smart Mill Scale!</h3>
                  <p className="text-gray-300 mb-4">
                    Setup wizard akan membantu Anda mengkonfigurasi sistem penimbangan untuk pertama kali.
                  </p>
                  <div className="space-y-2 text-left max-w-md mx-auto">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Buat akun administrator</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Building className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Konfigurasi informasi perusahaan</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Sistem siap digunakan</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6 max-w-md mx-auto">
                {/* Default Credentials Button */}
                <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 text-sm font-medium mb-2">Gunakan Kredensial Default?</p>
                      <p className="text-gray-300 text-sm mb-3">
                        Anda dapat menggunakan kredensial default untuk login cepat:
                      </p>
                      <div className="bg-gray-700/50 rounded-lg p-3 text-xs space-y-1 mb-3">
                        <p className="text-gray-300"><strong>Username:</strong> admin</p>
                        <p className="text-gray-300"><strong>Password:</strong> Admin123!</p>
                      </div>
                      <button
                        onClick={handleUseDefaultCredentials}
                        disabled={isLoading}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                      >
                        Gunakan Default
                      </button>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username Administrator
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.username ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Masukkan username"
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.username && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.username}</p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      validationErrors.fullName ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Masukkan nama lengkap"
                    disabled={isLoading}
                  />
                  {validationErrors.fullName && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="admin@perusahaan.com"
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.password ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Minimal 8 karakter"
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Ulangi password"
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 max-w-md mx-auto">
                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                    Nama Perusahaan
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.companyName ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="PT. Smart Mill Indonesia"
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.companyName && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.companyName}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                    Lokasi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        validationErrors.location ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Jakarta, Indonesia"
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.location && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.location}</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-4">
                <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-6">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-400 mb-2">Setup Selesai!</h3>
                  <p className="text-gray-300 mb-4">
                    Smart Mill Scale telah berhasil dikonfigurasi. Anda sekarang dapat login menggunakan akun administrator yang telah dibuat.
                  </p>
                  <div className="bg-gray-700/50 rounded-lg p-4 text-left max-w-md mx-auto">
                    <p className="text-sm text-gray-400 mb-2">Detail Administrator:</p>
                    <p className="text-sm text-white"><strong>Username:</strong> {formData.username}</p>
                    <p className="text-sm text-white"><strong>Nama:</strong> {formData.fullName}</p>
                    <p className="text-sm text-white"><strong>Email:</strong> {formData.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0 || isLoading}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : currentStep === 3 ? (
                <span>Selesai</span>
              ) : (
                <>
                  <span>{currentStep === 2 ? 'Selesaikan Setup' : 'Lanjutkan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupWizard