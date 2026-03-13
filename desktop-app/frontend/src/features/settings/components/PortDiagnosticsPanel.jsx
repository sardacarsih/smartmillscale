import { Shield, AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'

const PortDiagnosticsPanel = ({ portName }) => {
    const {
        selectedPortDiag,
        portsLoading,
        diagnoseCOMPort
    } = useSettingsStore()

    const handleRefresh = () => {
        if (portName) {
            diagnoseCOMPort(portName)
        }
    }

    if (!portName) {
        return (
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center space-x-2 text-gray-400">
                    <Info className="w-5 h-5" />
                    <span>Pilih port untuk melihat diagnostik</span>
                </div>
            </div>
        )
    }

    if (portsLoading && !selectedPortDiag) {
        return (
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center space-x-2 text-blue-400">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Memindai diagnostik port...</span>
                </div>
            </div>
        )
    }

    if (!selectedPortDiag) return null

    const { portInfo, accessibility, elevation } = selectedPortDiag

    const getAccessibilityStatus = () => {
        if (accessibility.canRead && accessibility.canWrite) {
            return {
                icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                text: 'Port dapat diakses',
                color: 'text-green-400'
            }
        }
        if (accessibility.requiresAdmin) {
            return {
                icon: <Shield className="w-5 h-5 text-yellow-500" />,
                text: 'Memerlukan hak administrator',
                color: 'text-yellow-400'
            }
        }
        return {
            icon: <XCircle className="w-5 h-5 text-red-500" />,
            text: 'Port tidak dapat diakses',
            color: 'text-red-400'
        }
    }

    const accessStatus = getAccessibilityStatus()

    return (
        <div className="space-y-4">
            {/* Port Information */}
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">Informasi Port</h3>
                    <button
                        onClick={handleRefresh}
                        disabled={portsLoading}
                        className="p-1 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                        title="Refresh diagnostik"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${portsLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-gray-400">Port:</span>
                        <p className="text-white font-semibold">{portInfo.name}</p>
                    </div>

                    {portInfo.friendlyName && (
                        <div>
                            <span className="text-gray-400">Nama:</span>
                            <p className="text-white">{portInfo.friendlyName}</p>
                        </div>
                    )}

                    {portInfo.manufacturer && (
                        <div>
                            <span className="text-gray-400">Manufaktur:</span>
                            <p className="text-white">{portInfo.manufacturer}</p>
                        </div>
                    )}

                    {portInfo.vid && portInfo.pid && (
                        <div>
                            <span className="text-gray-400">VID/PID:</span>
                            <p className="text-white font-mono">{portInfo.vid}:{portInfo.pid}</p>
                        </div>
                    )}

                    {portInfo.maxBaudRate > 0 && (
                        <div>
                            <span className="text-gray-400">Max Baud Rate:</span>
                            <p className="text-white">{portInfo.maxBaudRate} bps</p>
                        </div>
                    )}

                    {portInfo.driverInfo && (
                        <div>
                            <span className="text-gray-400">Driver:</span>
                            <p className="text-white">{portInfo.driverInfo}</p>
                        </div>
                    )}
                </div>

                {/* Port Type Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {portInfo.isVirtual && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            Virtual COM Port
                        </span>
                    )}
                    {portInfo.isUSBSerial && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            USB Serial
                        </span>
                    )}
                    {portInfo.configError && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                            Error Konfigurasi
                        </span>
                    )}
                </div>
            </div>

            {/* Accessibility Status */}
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-3">Status Aksesibilitas</h3>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status:</span>
                        <div className="flex items-center space-x-2">
                            {accessStatus.icon}
                            <span className={accessStatus.color}>{accessStatus.text}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Baca:</span>
                        <span className={accessibility.canRead ? 'text-green-400' : 'text-red-400'}>
                            {accessibility.canRead ? 'Ya' : 'Tidak'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Tulis:</span>
                        <span className={accessibility.canWrite ? 'text-green-400' : 'text-red-400'}>
                            {accessibility.canWrite ? 'Ya' : 'Tidak'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Memerlukan Admin:</span>
                        <span className={accessibility.requiresAdmin ? 'text-yellow-400' : 'text-green-400'}>
                            {accessibility.requiresAdmin ? 'Ya' : 'Tidak'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Elevation Status & Suggestions */}
            {elevation.requiresElevation && !elevation.isAdmin && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-yellow-400 font-semibold mb-2">
                                Diperlukan Hak Administrator
                            </h4>
                            <p className="text-gray-300 text-sm mb-3">
                                Port ini memerlukan hak administrator untuk diakses. Ikuti langkah berikut:
                            </p>
                            <ul className="space-y-1">
                                {elevation.suggestions?.map((suggestion, index) => (
                                    <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                                        <span className="text-yellow-400 mt-0.5">•</span>
                                        <span>{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Success State */}
            {elevation.isAdmin && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                            <h4 className="text-green-400 font-semibold">Hak Administrator Aktif</h4>
                            <p className="text-gray-300 text-sm">
                                Aplikasi berjalan dengan hak administrator. Akses COM port tersedia.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Error */}
            {portInfo.configError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-red-400 font-semibold mb-2">
                                Error Konfigurasi Port
                            </h4>
                            <p className="text-gray-300 text-sm mb-2">
                                Port mengalami error konfigurasi (Error Code: {portInfo.errorCode}).
                            </p>
                            <p className="text-gray-300 text-sm">
                                Periksa Device Manager dan pastikan driver terinstall dengan benar.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PortDiagnosticsPanel
