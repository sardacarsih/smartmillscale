import React from 'react'
import { List } from 'lucide-react'

/**
 * TransactionHeaderSection - Transaction number input with Pending List button
 * Groups related controls for better workflow and contextual grouping
 */
const TransactionHeaderSection = ({
  transactionNumber,
  onTransactionNumberChange,
  onOpenPendingList,
  isSubmitting,
  mode
}) => {
  const isTimbang1 = mode === 'timbang1'

  return (
    <div className="flex items-center gap-3">
      {/* Label + Input inline */}
      <label className="flex-shrink-0 w-32 text-sm font-medium text-gray-300">
        No. Transaksi
      </label>

      <input
        type="text"
        value={transactionNumber}
        onChange={(e) => onTransactionNumberChange(e.target.value.toUpperCase())}
        className="flex-1 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        disabled={isSubmitting}
      />

      {/* Pending List Button (only in Timbang1 mode) */}
      {isTimbang1 && (
        <button
          type="button"
          onClick={onOpenPendingList}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0"
          title="Lihat Daftar Pending Timbang 2"
        >
          <List className="w-4 h-4" />
          Pending List
        </button>
      )}
    </div>
  )
}

export default TransactionHeaderSection
