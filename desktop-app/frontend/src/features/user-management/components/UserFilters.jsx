import React, { useState } from 'react'
import { X, ChevronDown, ArrowUpDown } from 'lucide-react'

const UserFilters = ({ filters, onFilterChange, onClearFilters, onSort, usersByRole }) => {
  const [showRoleFilter, setShowRoleFilter] = useState(false)
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [showSortOptions, setShowSortOptions] = useState(false)

  const roleOptions = [
    { value: '', label: 'Semua Role' },
    { value: 'ADMIN', label: 'Administrator', count: usersByRole?.ADMIN || 0 },
    { value: 'SUPERVISOR', label: 'Supervisor', count: usersByRole?.SUPERVISOR || 0 },
    { value: 'TIMBANGAN', label: 'Operator Timbangan', count: usersByRole?.TIMBANGAN || 0 },
    { value: 'GRADING', label: 'Operator Grading', count: usersByRole?.GRADING || 0 }
  ]

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'true', label: 'Aktif' },
    { value: 'false', label: 'Nonaktif' }
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Tanggal Dibuat' },
    { value: 'username', label: 'Username' },
    { value: 'full_name', label: 'Nama Lengkap' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'last_login_at', label: 'Terakhir Login' }
  ]

  const handleFilterChange = (field, value) => {
    onFilterChange({ [field]: value })
  }

  const handleSortChange = (sortBy, sortOrder) => {
    onSort(sortBy, sortOrder)
    setShowSortOptions(false)
  }

  const hasActiveFilters = filters.search || filters.role || filters.isActive !== ''

  return (
    <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Filter & Sorting</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pencarian
          </label>
          <input
            type="text"
            placeholder="Cari username, nama, email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Role
          </label>
          <div className="relative">
            <button
              onClick={() => setShowRoleFilter(!showRoleFilter)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>
                {roleOptions.find(opt => opt.value === filters.role)?.label || 'Pilih Role'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showRoleFilter && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleFilterChange('role', option.value)
                      setShowRoleFilter(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 transition-colors ${
                      filters.role === option.value ? 'bg-blue-600 text-white' : 'text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.count > 0 && (
                        <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                          {option.count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <div className="relative">
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>
                {statusOptions.find(opt => opt.value === filters.isActive)?.label || 'Pilih Status'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showStatusFilter && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleFilterChange('isActive', option.value)
                      setShowStatusFilter(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 transition-colors ${
                      filters.isActive === option.value ? 'bg-blue-600 text-white' : 'text-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sorting
          </label>
          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4" />
                <span>
                  {sortOptions.find(opt => opt.value === filters.sortBy)?.label || 'Pilih Sorting'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showSortOptions && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                {sortOptions.map((option) => (
                  <div key={option.value} className="border-b border-gray-600 last:border-b-0">
                    <button
                      onClick={() => handleSortChange(option.value, 'ASC')}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 transition-colors ${
                        filters.sortBy === option.value && filters.sortOrder === 'ASC'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        <span className="text-xs">A-Z</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSortChange(option.value, 'DESC')}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 transition-colors ${
                        filters.sortBy === option.value && filters.sortOrder === 'DESC'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        <span className="text-xs">Z-A</span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Search: {filters.search}
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-2 hover:text-blue-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.role && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                Role: {roleOptions.find(opt => opt.value === filters.role)?.label}
                <button
                  onClick={() => handleFilterChange('role', '')}
                  className="ml-2 hover:text-green-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.isActive !== '' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Status: {statusOptions.find(opt => opt.value === filters.isActive)?.label}
                <button
                  onClick={() => handleFilterChange('isActive', '')}
                  className="ml-2 hover:text-yellow-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserFilters