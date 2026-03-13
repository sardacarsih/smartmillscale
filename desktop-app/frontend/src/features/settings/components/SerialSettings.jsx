import { Cpu, Usb, Activity, TestTube } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'

const SerialSettings = () => {
  const {
    serialSettings,
    updateSerialSettings,
    testSerialConnection,
    isLoading
  } = useSettingsStore()

  const baudRates = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]
  const dataBits = [7, 8]
  const parities = [
    { value: 'none', label: 'None' },
    { value: 'even', label: 'Even' },
    { value: 'odd', label: 'Odd' },
    { value: 'mark', label: 'Mark' },
    { value: 'space', label: 'Space' }
  ]
  const stopBits = [1, 1.5, 2]

  return (
    <div className="p-6 space-y-8">

      <div>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
          <Cpu className="w-6 h-6 text-purple-400" />
          <span>Pengaturan Serial Port</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Port Configuration */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Usb className="w-5 h-5 text-blue-400" />
              <span>Konfigurasi Port</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Port Serial
              </label>
              <input
                type="text"
                value={serialSettings.port}
                readOnly
                placeholder="Configured from .env"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Port dikonfigurasi dari file .env</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Baud Rate
              </label>
              <select
                value={serialSettings.baudRate}
                onChange={(e) => updateSerialSettings('baudRate', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {baudRates.map(rate => (
                  <option key={rate} value={rate}>
                    {rate} bps
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Data Bits
              </label>
              <select
                value={serialSettings.dataBits}
                onChange={(e) => updateSerialSettings('dataBits', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dataBits.map(bits => (
                  <option key={bits} value={bits}>
                    {bits}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Parity
              </label>
              <select
                value={serialSettings.parity}
                onChange={(e) => updateSerialSettings('parity', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {parities.map(parity => (
                  <option key={parity.value} value={parity.value}>
                    {parity.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Stop Bits
              </label>
              <select
                value={serialSettings.stopBits}
                onChange={(e) => updateSerialSettings('stopBits', parseFloat(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {stopBits.map(bits => (
                  <option key={bits} value={bits}>
                    {bits}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              <span>Pengaturan Lanjutan</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                min="100"
                max="30000"
                value={serialSettings.timeout}
                onChange={(e) => updateSerialSettings('timeout', parseInt(e.target.value) || 5000)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Waktu tunggu respons timbangan</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Jumlah Percobaan Ulang
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={serialSettings.retryAttempts}
                onChange={(e) => updateSerialSettings('retryAttempts', parseInt(e.target.value) || 3)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Jumlah percobaan ulang jika gagal</p>
            </div>

            {/* Test Connection */}
            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-md font-medium text-white mb-4 flex items-center space-x-2">
                <TestTube className="w-5 h-5 text-green-400" />
                <span>Uji Koneksi</span>
              </h4>

              <button
                onClick={testSerialConnection}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Menguji koneksi...</span>
                  </>
                ) : (
                  <>
                    <TestTube className="w-5 h-5" />
                    <span>Test Koneksi Serial</span>
                  </>
                )}
              </button>

              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-400">
                  <strong>Status:</strong>
                  <span className="text-green-400 ml-2">Ready</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  <strong>Port:</strong> {serialSettings.port} @ {serialSettings.baudRate} bps
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="mt-8 p-4 bg-gray-700/30 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Ringkasan Konfigurasi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Port:</span>
              <span className="text-gray-300 ml-2">{serialSettings.port}</span>
            </div>
            <div>
              <span className="text-gray-500">Baud Rate:</span>
              <span className="text-gray-300 ml-2">{serialSettings.baudRate}</span>
            </div>
            <div>
              <span className="text-gray-500">Data/Parity/Stop:</span>
              <span className="text-gray-300 ml-2">{serialSettings.dataBits}-{serialSettings.parity.charAt(0).toUpperCase()}-{serialSettings.stopBits}</span>
            </div>
            <div>
              <span className="text-gray-500">Timeout:</span>
              <span className="text-gray-300 ml-2">{serialSettings.timeout}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SerialSettings