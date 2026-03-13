import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PaginationControls = ({ pagination, onPageChange, onPageSizeChange, isLoading }) => {
  const { page, pageSize, totalPages, hasNext, hasPrevious } = pagination

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !isLoading) {
      onPageChange(newPage)
    }
  }

  const handlePageSizeChange = (newPageSize) => {
    if (newPageSize !== pageSize && !isLoading) {
      onPageSizeChange(newPageSize)
    }
  }

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages around current page with ellipsis
      const startPage = Math.max(1, page - 2)
      const endPage = Math.min(totalPages, startPage + 4)

      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
          pages.push('...')
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...')
        }
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
      {/* Page Size Selector */}
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <span>Tampilkan</span>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          disabled={isLoading}
          className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>data per halaman</span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!hasPrevious || isLoading}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === '...' ? (
                <span className="px-3 py-1 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    pageNum === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                  }`}
                >
                  {pageNum}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasNext || isLoading}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Current Page Info */}
      <div className="text-sm text-gray-400">
        Halaman {page} dari {totalPages}
      </div>
    </div>
  )
}

export default PaginationControls