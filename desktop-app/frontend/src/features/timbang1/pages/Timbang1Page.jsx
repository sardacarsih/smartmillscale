import React, { useEffect, useState } from 'react'
import PKSWeighingForm from '../components/PKSWeighingForm'
import usePKSStore from '../store/usePKSStore'
import { useWeightData, Topbar } from '../../../shared'
import useGlobalWeightStore from '../../../shared/store/useGlobalWeightStore'
import { useWailsService } from '../../../shared/contexts/WailsContext'

const Timbang1Page = ({ currentUser, wails, onNavigate, onLogout }) => {
  const [isInitializing, setIsInitializing] = useState(true)

  // Get PKS service from context
  const pksService = useWailsService('pks')
  const masterDataService = useWailsService('masterData')

  // Get user role from currentUser
  const userRole = currentUser?.role || 'TIMBANGAN'

  // PKS Store hooks
  const { initialize, loadingMasterData, masterDataError } = usePKSStore()

  // Subscribe to global weight monitoring state (managed by App.jsx)
  const {
    isMonitoring,
    isStarting,
    currentWeight,
    isStable,
    isConnected,
    unit,
    error: weightError,
    isReady
  } = useGlobalWeightStore()

  // Derived state
  const isActive = isMonitoring && isConnected

  // Weight Data Hook - for formatted data and utilities
  const {
    formattedWeight,
    connectionStatus,
    statusColor
  } = useWeightData({ role: userRole })

  useEffect(() => {
    const initializePage = async () => {
      setIsInitializing(true)

      try {
        // Initialize PKS store to load master data
        console.log('📋 [Timbang1Page] Initializing...')
        console.log('  - pksService:', pksService ? '✓ Available' : '✗ Missing')
        console.log('  - masterDataService:', masterDataService ? '✓ Available' : '✗ Missing')

        if (!pksService || !masterDataService) {
          const missing = []
          if (!pksService) missing.push('pksService')
          if (!masterDataService) missing.push('masterDataService')
          throw new Error(`Services not available: ${missing.join(', ')}`)
        }

        await initialize(pksService, masterDataService)

        console.log('✅ [Timbang1Page] Initialization complete')

      } catch (error) {
        console.error('❌ [Timbang1Page] Failed to initialize page:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializePage()
  }, [initialize, pksService, masterDataService])


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Topbar - Same as Dashboard */}
      <Topbar
        title="Smart Mill Scale"
        subtitle="Timbangan"
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* PKS Weighing Form Section */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              {isInitializing || loadingMasterData ? (
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-300">
                      {isInitializing ? 'Menginisialisasi sistem timbangan...' : 'Memuat data master...'}
                    </p>
                    {isStarting && (
                      <p className="text-gray-400 text-sm mt-2">Memulai monitor berat real-time...</p>
                    )}
                  </div>
                </div>
              ) : masterDataError ? (
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                  <div className="p-8 text-center">
                    <div className="text-red-400 mb-4">❌ Error loading master data</div>
                    <p className="text-gray-300">{masterDataError}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                  <div className="p-6">
                    <PKSWeighingForm
                      currentWeight={currentWeight}
                      isStable={isStable}
                      isConnected={isConnected}
                      isMonitoring={isMonitoring}
                      currentUser={currentUser}
                      wails={wails}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Timbang1Page