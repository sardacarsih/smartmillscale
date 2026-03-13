import React from 'react'
import { X } from 'lucide-react'
import PendingList from './PendingList'

const PendingListModal = ({ onClose, onSelectTransaction, currentUser }) => {
  const handleSelectTransaction = (transaction) => {
    onSelectTransaction(transaction)
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative bg-gray-900 rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          title="Tutup"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        {/* Pending List Component */}
        <div className="overflow-y-auto max-h-[90vh]">
          <PendingList
            onSelectTransaction={handleSelectTransaction}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  )
}

export default PendingListModal
