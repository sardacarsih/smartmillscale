import { describe, it, expect, vi } from 'vitest'
import { MasterDataService } from './MasterDataService'

describe('MasterDataService', () => {
  it('triggerMasterDataSync uses default scope and trigger source', async () => {
    const wails = {
      TriggerMasterDataSync: vi.fn().mockResolvedValue(
        JSON.stringify({ success: true, scope: ['estate', 'afdeling', 'blok'] })
      )
    }

    const service = new MasterDataService(wails)
    const result = await service.triggerMasterDataSync()

    expect(wails.TriggerMasterDataSync).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(wails.TriggerMasterDataSync.mock.calls[0][0])
    expect(payload.triggerSource).toBe('manual')
    expect(payload.scope).toEqual(['estate', 'afdeling', 'blok'])
    expect(result.success).toBe(true)
  })

  it('getMasterDataSyncStatus parses backend JSON result', async () => {
    const status = {
      syncInProgress: false,
      lastResult: { success: true }
    }

    const wails = {
      GetMasterDataSyncStatus: vi.fn().mockResolvedValue(JSON.stringify(status))
    }

    const service = new MasterDataService(wails)
    const result = await service.getMasterDataSyncStatus()

    expect(wails.GetMasterDataSyncStatus).toHaveBeenCalledTimes(1)
    expect(result).toEqual(status)
  })
})
