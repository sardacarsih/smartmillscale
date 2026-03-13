import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Modern DataTable Component
 *
 * Features:
 * - Responsive design with modern styling
 * - Built-in search functionality
 * - Pagination controls
 * - Sortable columns
 * - Row selection (single/multiple)
 * - Loading states
 * - Empty state handling
 * - Action buttons for each row
 */

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  pagination = {},
  search = '',
  onSearchChange,
  onPageChange,
  onSort,
  onRowClick,
  onEdit,
  onDelete,
  selectedRows = [],
  onSelectionChange,
  selectable = false,
  actions = true,
  className = ''
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [localSearch, setLocalSearch] = useState(search);

  // Handle search with debouncing
  const handleSearchChange = (value) => {
    setLocalSearch(value);
    if (onSearchChange) {
      const timeoutId = setTimeout(() => {
        onSearchChange(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  };

  // Handle sorting
  const handleSort = (columnKey) => {
    const newDirection = sortConfig.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig = { key: columnKey, direction: newDirection };
    setSortConfig(newSortConfig);

    if (onSort) {
      onSort(newSortConfig);
    }
  };

  // Sort and filter data
  const sortedAndFilteredData = useMemo(() => {
    let filteredData = data;

    // Client-side search filter (if server-side search is not implemented)
    if (localSearch && !onSearchChange) {
      filteredData = data.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(localSearch.toLowerCase())
        )
      );
    }

    // Client-side sorting (if server-side sorting is not implemented)
    if (sortConfig.key && !onSort) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, localSearch, sortConfig, onSearchChange, onSort]);

  // Handle selection
  const handleSelectAll = (checked) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? sortedAndFilteredData.map(item => item.id) : []);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedRows, id]
        : selectedRows.filter(rowId => rowId !== id);
      onSelectionChange(newSelection);
    }
  };

  const isAllSelected = selectable && sortedAndFilteredData.length > 0 &&
    sortedAndFilteredData.every(item => selectedRows.includes(item.id));
  const isIndeterminate = selectable && selectedRows.length > 0 &&
    selectedRows.length < sortedAndFilteredData.length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {selectable && selectedRows.length > 0 && (
            <div className="ml-4 text-sm text-gray-500">
              {selectedRows.length} item{selectedRows.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th width="40" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={column.key}
                  width={column.width}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable !== false && sortConfig.key === column.key && (
                      <span className="text-blue-600">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {actions && (
                <th width="120" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : sortedAndFilteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <div className="text-lg font-medium">No data found</div>
                    <div className="text-sm mt-1">Try adjusting your search or filters</div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedAndFilteredData.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${
                    selectedRows.includes(item.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {selectable && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(item.id, e.target.checked);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      {column.render ? (
                        column.render(item[column.key], item)
                      ) : (
                        <div className="text-sm text-gray-900">
                          {item[column.key]}
                        </div>
                      )}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item);
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {onEdit && onDelete && (
                          <span className="text-gray-300">|</span>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item);
                            }}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    pageNum === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;