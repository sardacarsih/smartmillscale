import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CubeIcon,
  ScaleIcon,
  TruckIcon,
  BuildingOfficeIcon,
  MapIcon,
  ViewColumnsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useMasterDataStore, ENTITY_TYPES } from './useMasterDataStore';
import { useWailsService } from '../../shared/contexts/WailsContext';
import { clearPKSMasterDataCache } from '../timbang1/store/usePKSStore';
// Lazy load all tabs for better performance - only load when tab is active
const ProdukTab = lazy(() => import('./tabs/ProdukTab'));
const UnitTab = lazy(() => import('./tabs/UnitTab'));
const SupplierTab = lazy(() => import('./tabs/SupplierTab'));
const EstateTab = lazy(() => import('./tabs/EstateTab'));
const AfdelingTab = lazy(() => import('./tabs/AfdelingTab'));
const BlokTab = lazy(() => import('./tabs/BlokTab'));
import { PageShell } from '../../shared';

/**
 * MasterDataPage Component
 *
 * Modern tabbed interface for managing PKS master data entities.
 */

const MasterDataPage = ({ currentUser, wails, onNavigate, onLogout }) => {
  const { activeEntity, setActiveEntity } = useMasterDataStore();
  const masterDataService = useWailsService('masterData', { optional: true });

  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncRefreshToken, setSyncRefreshToken] = useState(0);

  const formatDateTime = useCallback((value) => {
    if (!value) {
      return '-';
    }
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  }, []);

  const loadSyncStatus = useCallback(async () => {
    if (!masterDataService) {
      return;
    }

    try {
      const status = await masterDataService.getMasterDataSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      setSyncError(error?.message || 'Gagal memuat status sinkronisasi master data');
    }
  }, [masterDataService]);

  useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  useEffect(() => {
    const onSyncSuccess = (event) => {
      const result = event?.detail;
      if (result) {
        setSyncStatus((prev) => ({
          ...(prev || {}),
          lastResult: result,
          lastAttemptAt: result.syncedAt || new Date().toISOString(),
          lastSuccessAt: result.success ? (result.syncedAt || new Date().toISOString()) : prev?.lastSuccessAt
        }));
      }
      setSyncRefreshToken((prev) => prev + 1);
      loadSyncStatus();
    };

    window.addEventListener('master-data:sync-success', onSyncSuccess);
    return () => {
      window.removeEventListener('master-data:sync-success', onSyncSuccess);
    };
  }, [loadSyncStatus]);

  const handleManualSync = useCallback(async () => {
    if (!masterDataService || syncLoading) {
      return;
    }

    setSyncLoading(true);
    setSyncError('');

    try {
      const result = await masterDataService.triggerMasterDataSync({
        triggerSource: 'manual',
        scope: ['estate', 'afdeling', 'blok']
      });

      setSyncStatus((prev) => ({
        ...(prev || {}),
        lastResult: result,
        lastAttemptAt: result?.syncedAt || new Date().toISOString(),
        lastSuccessAt: result?.success ? (result.syncedAt || new Date().toISOString()) : prev?.lastSuccessAt
      }));

      if (result?.success) {
        clearPKSMasterDataCache();
        setSyncRefreshToken((prev) => prev + 1);
        window.dispatchEvent(new CustomEvent('master-data:sync-success', { detail: result }));
      }

      if (!result?.success && result?.error) {
        setSyncError(result.error);
      }

      await loadSyncStatus();
    } catch (error) {
      setSyncError(error?.message || 'Sinkronisasi master data gagal dijalankan');
    } finally {
      setSyncLoading(false);
    }
  }, [masterDataService, syncLoading, loadSyncStatus]);

  // Tab configuration
  const tabs = [
    {
      id: ENTITY_TYPES.PRODUK,
      name: 'Produk',
      description: 'Kelola data produk (TBS, CPO, KERNEL)',
      icon: CubeIcon,
      color: 'blue',
      component: ProdukTab
    },
    {
      id: ENTITY_TYPES.UNIT,
      name: 'Unit',
      description: 'Kelola data unit kendaraan',
      icon: ScaleIcon,
      color: 'green',
      component: UnitTab
    },
    {
      id: ENTITY_TYPES.SUPPLIER,
      name: 'Supplier',
      description: 'Kelola data supplier/petani',
      icon: TruckIcon,
      color: 'purple',
      component: SupplierTab
    },
    {
      id: ENTITY_TYPES.ESTATE,
      name: 'Estate',
      description: 'Kelola data estate perkebunan',
      icon: BuildingOfficeIcon,
      color: 'orange',
      component: EstateTab
    },
    {
      id: ENTITY_TYPES.AFDELING,
      name: 'Afdeling',
      description: 'Kelola data afdeling',
      icon: MapIcon,
      color: 'teal',
      component: AfdelingTab
    },
    {
      id: ENTITY_TYPES.BLOK,
      name: 'Blok',
      description: 'Kelola data blok',
      icon: ViewColumnsIcon,
      color: 'indigo',
      component: BlokTab
    },
  ];

  // Get current active tab component
  const ActiveTabComponent = tabs.find(tab => tab.id === activeEntity)?.component || ProdukTab;

  const lastResult = syncStatus?.lastResult;
  const countSummary = useMemo(() => {
    const counts = lastResult?.counts || {};
    const entities = ['estate', 'afdeling', 'blok'];

    return entities.map((entity) => {
      const c = counts?.[entity] || {};
      return {
        entity,
        created: c.created || 0,
        updated: c.updated || 0,
        deactivated: c.deactivated || 0,
        skipped: c.skipped || 0
      };
    });
  }, [lastResult]);

  // Color utilities
  const getColorClasses = (color, type = 'bg') => {
    const colors = {
      blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-600', border: 'border-blue-500', light: 'bg-blue-50' },
      green: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-green-600', border: 'border-green-500', light: 'bg-green-50' },
      purple: { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', text: 'text-purple-600', border: 'border-purple-500', light: 'bg-purple-50' },
      orange: { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-600', border: 'border-orange-500', light: 'bg-orange-50' },
      teal: { bg: 'bg-teal-500', hover: 'hover:bg-teal-600', text: 'text-teal-600', border: 'border-teal-500', light: 'bg-teal-50' },
      indigo: { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-500', light: 'bg-indigo-50' },
      pink: { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', text: 'text-pink-600', border: 'border-pink-500', light: 'bg-pink-50' }
    };
    return colors[color]?.[type] || colors.blue[type];
  };

  return (
    <PageShell
      title="Smart Mill Scale"
      subtitle="Master Data PKS"
      currentUser={currentUser}
      onLogout={onLogout}
      onNavigate={onNavigate}
      pageTitle="Master Data"
      pageDescription="Kelola seluruh master data PKS dengan status sinkronisasi yang tetap terbaca jelas pada laptop dan desktop."
      contentWidth="wide"
    >
      <div className="rounded-2xl border border-gray-700 bg-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Master Data</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Kelola semua data master untuk sistem Smart Mill Scale
                </p>
              </div>
              <button
                onClick={handleManualSync}
                disabled={syncLoading || !masterDataService}
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border ${syncLoading
                  ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                  }`}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                Sinkronisasi Master Data
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900/40 p-4">
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <div className="text-gray-400">Sinkronisasi Terakhir</div>
                  <div className="text-white font-medium">{formatDateTime(lastResult?.syncedAt || syncStatus?.lastSuccessAt)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Status Terakhir</div>
                  <div className={`font-medium ${lastResult?.success ? 'text-green-400' : 'text-yellow-300'}`}>
                    {lastResult ? (lastResult.success ? 'BERHASIL' : 'GAGAL') : 'BELUM ADA'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Percobaan Terakhir</div>
                  <div className="text-white font-medium">{formatDateTime(syncStatus?.lastAttemptAt)}</div>
                </div>
              </div>

              {countSummary.length > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs text-gray-300">
                  {countSummary.map((item) => (
                    <div key={item.entity} className="rounded border border-gray-700 px-3 py-2">
                      <div className="font-semibold uppercase text-gray-200">{item.entity}</div>
                      <div className="mt-1">C:{item.created} U:{item.updated} D:{item.deactivated} S:{item.skipped}</div>
                    </div>
                  ))}
                </div>
              )}

              {(syncError || lastResult?.error) && (
                <div className="mt-3 rounded border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-200">
                  {syncError || lastResult?.error}
                </div>
              )}
            </div>

            <div className="mt-6 overflow-x-auto">
              <nav className="flex min-w-max space-x-1" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeEntity === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveEntity(tab.id)}
                      className={`
                        group relative min-w-0 flex-1 overflow-hidden rounded-lg py-2 px-3 text-center text-sm font-medium
                        transition-all duration-200 ease-in-out
                        ${isActive
                          ? `${getColorClasses(tab.color, 'bg')} text-white shadow-sm`
                          : `text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600`
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Icon className="h-5 w-5" />
                        <span className="truncate">{tab.name}</span>
                      </div>

                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {tab.description}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading master data...</p>
              </div>
            </div>
          }
        >
          <ActiveTabComponent syncRefreshToken={syncRefreshToken} />
        </Suspense>
      </div>

      <div className="mt-6">
        <div className="rounded-xl border border-blue-700/50 bg-blue-900/30 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-300">
                Tips Master Data PKS
              </h3>
              <p className="mt-1 text-sm text-blue-200">
                Sumber utama master data berasal dari server pusat saat koneksi tersedia. Input lokal tetap tersedia untuk kondisi darurat sebagai data manual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default MasterDataPage;
