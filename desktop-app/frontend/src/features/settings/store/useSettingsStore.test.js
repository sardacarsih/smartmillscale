import { beforeEach, describe, expect, it, vi } from 'vitest'
import useSettingsStore from './useSettingsStore'
import {
  GetSystemSettings,
  UpdateSystemSettings,
  TestCOMPortConnection
} from '../../../../wailsjs/go/main/App'

vi.mock('../../../../wailsjs/go/main/App', () => ({
  GetSystemSettings: vi.fn(),
  UpdateSystemSettings: vi.fn(),
  TestCOMPortConnection: vi.fn()
}))

const DEFAULT_GENERAL_SETTINGS = {
  siteName: 'Smart Mill Scale',
  siteDescription: 'Sistem Manajemen Timbangan Digital',
  language: 'id',
  timezone: 'Asia/Jakarta',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24'
}

const DEFAULT_SYSTEM_SETTINGS = {
  autoBackup: true,
  backupInterval: 'daily',
  retentionDays: 30,
  syncEnabled: true,
  syncInterval: 5,
  sessionTimeout: 30,
  maxLoginAttempts: 3
}

const DEFAULT_SERIAL_SETTINGS = {
  port: 'COM1',
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  timeout: 5000,
  retryAttempts: 3
}

const DEFAULT_SECURITY_SETTINGS = {
  passwordMinLength: 6,
  passwordRequireUppercase: false,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  sessionTimeoutMinutes: 30,
  lockScreenAfterMinutes: 10
}

const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'PT. Smart Mill Scale',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyCode: 'SMS',
  ticketDateFormat: 'YYYYMM',
  ticketDigits: 4,
  ticketSeparator: '-'
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useSettingsStore.setState({
      settings: null,
      isLoading: false,
      error: null,
      hasChanges: false,
      generalSettings: { ...DEFAULT_GENERAL_SETTINGS },
      systemSettings: { ...DEFAULT_SYSTEM_SETTINGS },
      serialSettings: { ...DEFAULT_SERIAL_SETTINGS },
      securitySettings: { ...DEFAULT_SECURITY_SETTINGS },
      companySettings: { ...DEFAULT_COMPANY_SETTINGS }
    })
  })

  it('loadSettings mengisi store dari backend dan merge default', async () => {
    GetSystemSettings.mockResolvedValue(
      JSON.stringify({
        general: { language: 'en' },
        system: { syncInterval: 10 },
        serial: { port: 'COM7', parity: 'odd', stopBits: 2 },
        security: { passwordMinLength: 12 },
        company: { companyName: 'PT Testing' }
      })
    )

    const result = await useSettingsStore.getState().loadSettings()

    expect(result.success).toBe(true)
    expect(GetSystemSettings).toHaveBeenCalledTimes(1)

    const state = useSettingsStore.getState()
    expect(state.generalSettings.language).toBe('en')
    expect(state.generalSettings.siteName).toBe('Smart Mill Scale')
    expect(state.systemSettings.syncInterval).toBe(10)
    expect(state.serialSettings.port).toBe('COM7')
    expect(state.serialSettings.parity).toBe('odd')
    expect(state.serialSettings.stopBits).toBe(2)
    expect(state.securitySettings.passwordMinLength).toBe(12)
    expect(state.companySettings.companyName).toBe('PT Testing')
    expect(state.hasChanges).toBe(false)
  })

  it('saveSettings mengirim seluruh payload ke backend', async () => {
    UpdateSystemSettings.mockResolvedValue(undefined)

    const store = useSettingsStore.getState()
    store.updateGeneralSettings('language', 'en')
    store.updateSystemSettings('syncInterval', 15)
    store.updateSerialSettings('port', 'COM9')
    store.updateSecuritySettings('passwordMinLength', 9)
    store.updateCompanySettings('companyName', 'PT Persisted')

    const result = await useSettingsStore.getState().saveSettings()

    expect(result.success).toBe(true)
    expect(UpdateSystemSettings).toHaveBeenCalledTimes(1)

    const sentPayload = JSON.parse(UpdateSystemSettings.mock.calls[0][0])
    expect(sentPayload.general.language).toBe('en')
    expect(sentPayload.system.syncInterval).toBe(15)
    expect(sentPayload.serial.port).toBe('COM9')
    expect(sentPayload.security.passwordMinLength).toBe(9)
    expect(sentPayload.company.companyName).toBe('PT Persisted')

    expect(useSettingsStore.getState().hasChanges).toBe(false)
  })

  it('testSerialConnection memakai backend diagnostics', async () => {
    useSettingsStore.getState().updateSerialSettings('port', 'COM8')

    TestCOMPortConnection.mockResolvedValue(
      JSON.stringify({
        canRead: true,
        canWrite: true,
        requiresAdmin: false,
        errorMessage: ''
      })
    )

    const successResult = await useSettingsStore.getState().testSerialConnection()
    expect(successResult.success).toBe(true)
    expect(TestCOMPortConnection).toHaveBeenCalledWith('COM8')

    TestCOMPortConnection.mockResolvedValue(
      JSON.stringify({
        canRead: false,
        canWrite: false,
        requiresAdmin: false,
        errorMessage: 'Port busy'
      })
    )

    const failResult = await useSettingsStore.getState().testSerialConnection()
    expect(failResult.success).toBe(false)
    expect(failResult.error).toContain('Port busy')
  })
})
