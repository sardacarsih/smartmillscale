import React, { useState, useEffect } from 'react'
import usePKSStore from '../store/usePKSStore'
import { useWailsService } from '../../../shared/contexts/WailsContext'

const PendingList = ({ onSelectTransaction }) => {
  const pksService = useWailsService('pks')
  const {
    pendingTimbang2: pendingTransactions,
    loadingPending: loading,
    pendingError: error,
    fetchPendingTimbang2: fetchPendingTransactions
  } = usePKSStore()

  useEffect(() => {
    if (pksService) {
      fetchPendingTransactions(pksService)
    }
  }, [fetchPendingTransactions, pksService])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-300">Loading pending transactions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-2">Error loading pending transactions</div>
        <p className="text-gray-400">{error}</p>
      </div>
    )
  }

  if (!pendingTransactions || pendingTransactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-2">No pending transactions</div>
        <p className="text-gray-500 text-sm">All transactions have been processed</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-md font-semibold text-white mb-3">Pending Transactions</h3>
      <div className="space-y-1">
        {pendingTransactions.map((transaction) => (
          <div
            key={transaction.id}
            onClick={() => onSelectTransaction(transaction)}
            className="bg-gray-800 rounded p-2 hover:bg-gray-700 cursor-pointer transition-colors border border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white font-medium">
                  {transaction.vehicleNumber || 'Unknown Vehicle'}
                </div>
                <div className="text-gray-400 text-xs">
                  {transaction.transporterName || 'Unknown Transporter'}
                </div>
                <div className="text-gray-500 text-[10px]">
                  {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'No timestamp'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white font-medium">
                  {transaction.weight ? `${transaction.weight} kg` : 'No weight'}
                </div>
                <div className="text-yellow-400 text-xs">
                  {transaction.status || 'Pending'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PendingList