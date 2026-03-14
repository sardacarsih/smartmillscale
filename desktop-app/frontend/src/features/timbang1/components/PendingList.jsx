import React, { useEffect } from 'react'
import usePKSStore from '../store/usePKSStore'
import { useWailsService } from '../../../shared/contexts/WailsContext'

const getSourceSummary = (transaction) => {
  if (transaction?.sourceSummary) {
    return transaction.sourceSummary
  }

  const detailRows = Array.isArray(transaction?.tbs_block_details)
    ? transaction.tbs_block_details
    : (Array.isArray(transaction?.tbsBlockDetails) ? transaction.tbsBlockDetails : [])

  if (detailRows.length > 1) {
    return `Campuran (${detailRows.length} blok)`
  }

  if (detailRows.length === 1) {
    const detail = detailRows[0]
    const blok = detail?.blok || {}
    const kode = blok.kode_blok || blok.kodeBlok
    const nama = blok.nama_blok || blok.namaBlok
    if (kode && nama) {
      return `${kode} - ${nama}`
    }
    if (nama) {
      return nama
    }
    if (kode) {
      return kode
    }
  }

  const blok = transaction?.blok || {}
  const kode = blok.kode_blok || blok.kodeBlok
  const nama = blok.nama_blok || blok.namaBlok
  if (kode && nama) {
    return `${kode} - ${nama}`
  }

  return transaction?.sumber_tbs || transaction?.sumberTbs || '-'
}

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
                  {transaction.unit?.nomor_polisi || transaction.nomor_kendaraan || '-'}
                </div>
                <div className="text-gray-400 text-xs">
                  {transaction.produk?.nama_produk || transaction.productName || '-'}
                </div>
                <div className="text-gray-500 text-[11px]">
                  {getSourceSummary(transaction)}
                </div>
                <div className="text-gray-500 text-[10px]">
                  {transaction.timbang1_date || transaction.timbang1Date
                    ? new Date(transaction.timbang1_date || transaction.timbang1Date).toLocaleString('id-ID')
                    : '-'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white font-medium">
                  {Number.isFinite(Number(transaction.bruto)) ? `${Number(transaction.bruto).toFixed(2)} kg` : '-'}
                </div>
                <div className="text-yellow-400 text-xs">
                  {transaction.status || 'timbang1'}
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
