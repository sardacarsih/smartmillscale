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
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      {/* Label + Input inline */}
      <label className="flex-shrink-0 text-sm font-medium text-gray-300 xl:w-32">
        No. Transaksi
      </label>

      <input
        type="text"
        value={transactionNumber}
        onChange={(e) => onTransactionNumberChange(e.target.value.toUpperCase())}
        className="w-full flex-1 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
        disabled={isSubmitting}
      />

      {/* Pending List Button (only in Timbang1 mode) */}
      {isTimbang1 && (
        <button
          type="button"
          onClick={onOpenPendingList}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 xl:flex-shrink-0"
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
