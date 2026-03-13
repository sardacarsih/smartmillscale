import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * DeleteConfirmModal Component
 *
 * Features:
 * - Modern confirmation dialog for delete operations
 * - Customizable message and title
 * - Loading states
 * - Accessibility support
 */

const DeleteConfirmModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName = '',
  isLoading = false,
  error = null,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  dangerous = true,
  className = ''
}) => {
  const handleConfirm = () => {
    if (onConfirm && !isLoading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal Panel */}
        <div className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg ${className}`}>
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 ${
                  dangerous ? 'bg-red-100' : 'bg-yellow-100'
                } rounded-full p-2`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${
                    dangerous ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    {title}
                  </h3>
                  {itemName && (
                    <p className="mt-1 text-sm font-medium text-gray-600">
                      "{itemName}"
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleClose}
                disabled={isLoading}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {error && (
              <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {cancelButtonText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                dangerous
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
              }`}
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {!isLoading && (
                <TrashIcon className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Deleting...' : confirmButtonText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;