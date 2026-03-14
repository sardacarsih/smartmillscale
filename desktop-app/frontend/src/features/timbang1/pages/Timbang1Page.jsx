import React, { useEffect, useState } from 'react'
import PKSWeighingForm from '../components/PKSWeighingForm'
import usePKSStore from '../store/usePKSStore'
import { PageShell } from '../../../shared'
import useGlobalWeightStore from '../../../shared/store/useGlobalWeightStore'
import { useWailsService } from '../../../shared/contexts/WailsContext'

const Timbang1Page = ({ currentUser, wails, onNavigate, onLogout }) => {
  const [isInitializing, setIsInitializing] = useState(true)

  // Get PKS service from context
  const pksService = useWailsService('pks')
  const masterDataService = useWailsService('masterData')

  // PKS Store hooks
  const { initialize, loadingMasterData, masterDataError } = usePKSStore()

  // Subscribe to global weight monitoring state (managed by App.jsx)
  const {
    isMonitoring,
    isStarting,
    currentWeight,
    isStable,
    isConnected,
  } = useGlobalWeightStore()

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
    <PageShell
      title="Smart Mill Scale"
      subtitle="Timbangan"
      currentUser={currentUser}
      onLogout={onLogout}
      onNavigate={onNavigate}
      pageTitle="Penimbangan PKS"
      pageDescription="Layout operator yang menjaga panel berat dan form transaksi tetap nyaman digunakan pada laptop maupun desktop."
      contentWidth="wide"
    >
      {isInitializing || loadingMasterData ? (
        <div className="rounded-2xl border border-gray-700 bg-gray-800 shadow-xl">
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
        <div className="rounded-2xl border border-gray-700 bg-gray-800 shadow-xl">
          <div className="p-8 text-center">
            <div className="mb-4 text-red-400">Error loading master data</div>
            <p className="text-gray-300">{masterDataError}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-700 bg-gray-800 shadow-xl">
          <div className="p-4 sm:p-6">
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
    </PageShell>
  )
}

export default Timbang1Page
