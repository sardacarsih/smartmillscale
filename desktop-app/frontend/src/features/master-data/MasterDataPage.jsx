import React, { Suspense, lazy } from 'react';
import {
  CubeIcon,
  ScaleIcon,
  TruckIcon,
  BuildingOfficeIcon,
  MapIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline';
import { useMasterDataStore, ENTITY_TYPES } from './useMasterDataStore';
// Lazy load all tabs for better performance - only load when tab is active
const ProdukTab = lazy(() => import('./tabs/ProdukTab'));
const UnitTab = lazy(() => import('./tabs/UnitTab'));
const SupplierTab = lazy(() => import('./tabs/SupplierTab'));
const EstateTab = lazy(() => import('./tabs/EstateTab'));
const AfdelingTab = lazy(() => import('./tabs/AfdelingTab'));
const BlokTab = lazy(() => import('./tabs/BlokTab'));
import { Topbar } from '../../shared';

/**
 * MasterDataPage Component
 *
 * Modern tabbed interface for managing PKS master data entities.
 * Features:
 * - Clean tabbed navigation for 6 master data entities
 * - Entity-specific icons and colors
 * - Responsive design
 * - Real-time data synchronization
 * - Role-based access control
 */

const MasterDataPage = ({ currentUser, wails, onNavigate, onLogout }) => {
  const { activeEntity, setActiveEntity } = useMasterDataStore();

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

  // Color utilities
  const getColorClasses = (color, type = 'bg') => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        hover: 'hover:bg-blue-600',
        text: 'text-blue-600',
        border: 'border-blue-500',
        light: 'bg-blue-50'
      },
      green: {
        bg: 'bg-green-500',
        hover: 'hover:bg-green-600',
        text: 'text-green-600',
        border: 'border-green-500',
        light: 'bg-green-50'
      },
      purple: {
        bg: 'bg-purple-500',
        hover: 'hover:bg-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-500',
        light: 'bg-purple-50'
      },
      orange: {
        bg: 'bg-orange-500',
        hover: 'hover:bg-orange-600',
        text: 'text-orange-600',
        border: 'border-orange-500',
        light: 'bg-orange-50'
      },
      teal: {
        bg: 'bg-teal-500',
        hover: 'hover:bg-teal-600',
        text: 'text-teal-600',
        border: 'border-teal-500',
        light: 'bg-teal-50'
      },
      indigo: {
        bg: 'bg-indigo-500',
        hover: 'hover:bg-indigo-600',
        text: 'text-indigo-600',
        border: 'border-indigo-500',
        light: 'bg-indigo-50'
      },
      pink: {
        bg: 'bg-pink-500',
        hover: 'hover:bg-pink-600',
        text: 'text-pink-600',
        border: 'border-pink-500',
        light: 'bg-pink-50'
      }
    };
    return colors[color]?.[type] || colors.blue[type];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Topbar */}
      <Topbar
        title="Smart Mill Scale"
        subtitle="Master Data PKS"
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Master Data</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Kelola semua data master untuk sistem Smart Mill Scale
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-6">
              <nav className="flex space-x-1" aria-label="Tabs">
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

                      {/* Tooltip on hover */}
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

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
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
            <ActiveTabComponent />
          </Suspense>
        </div>
      </div>

      {/* Tab Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
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
                Master data merupakan fondasi untuk semua operasi PKS. Pastikan data yang dimasukkan akurat dan lengkap.
                Data master digunakan dalam pencatatan TBS, pelaporan CPO, dan analisis operasional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataPage;