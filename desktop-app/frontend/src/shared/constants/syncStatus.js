/**
 * Sync Status Constants
 */

export const SYNC_STATUS = {
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  SYNCED: 'SYNCED',
  FAILED: 'FAILED',
}

export const SYNC_STATUS_LABELS = {
  [SYNC_STATUS.PENDING]: 'Menunggu Sinkronisasi',
  [SYNC_STATUS.SYNCING]: 'Sedang Sinkronisasi',
  [SYNC_STATUS.SYNCED]: 'Tersinkronisasi',
  [SYNC_STATUS.FAILED]: 'Gagal Sinkronisasi',
}

export const SYNC_STATUS_COLORS = {
  [SYNC_STATUS.PENDING]: 'bg-yellow-500',
  [SYNC_STATUS.SYNCING]: 'bg-blue-500',
  [SYNC_STATUS.SYNCED]: 'bg-green-500',
  [SYNC_STATUS.FAILED]: 'bg-red-500',
}

export default SYNC_STATUS
