import { useState, useEffect } from 'react'
import { X, Usb, Cpu, RefreshCw, TestTube, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'

const COMPortSelector = ({ isOpen, onClose, currentPort }) => {
    const {
        availablePorts,
        portsLoading,
        fetchAvailablePorts,
        testCOMPort,
        selectPort
    } = useSettingsStore()

    const [testingPort, setTestingPort] = useState(null)
    const [testResults, setTestResults] = useState({})

    useEffect(() => {
        if (isOpen) {
            fetchAvailablePorts()
        }
    }, [isOpen, fetchAvailablePorts])

    const handleRefresh = async () => {
        setTestResults({})
        await fetchAvailablePorts()
    }

    const handleTestPort = async (portName) => {
        setTestingPort(portName)
        const result = await testCOMPort(portName)
        setTestResults(prev => ({
            ...prev,
            [portName]: result
        }))
        setTestingPort(null)
    }

    const handleSelectPort = (portName) => {
        selectPort(portName)
        onClose()
    }

    const getPortStatusColor = (port) => {
        if (port.configError) return 'border-red-500 bg-red-500/10'
        if (port.requiresAdmin) return 'border-yellow-500 bg-yellow-500/10'
        if (port.canRead && port.canWrite) return 'border-green-500 bg-green-500/10'
        return 'border-blue-500 bg-blue-500/10'
    }

    const getPortStatusIcon = (port) => {
        if (port.configError) return <XCircle className="w-5 h-5 text-red-500" />
        if (port.requiresAdmin) return <Shield className="w-5 h-5 text-yellow-500" />
        if (port.canRead && port.canWrite) return <CheckCircle className="w-5 h-5 text-green-500" />
        return <AlertTriangle className="w-5 h-5 text-blue-500" />
    }

    const getPortStatusText = (port) => {
        if (port.configError) return 'Error Konfigurasi'
        if (port.requiresAdmin) return 'Memerlukan Admin'
        if (port.canRead && port.canWrite) return 'Siap Digunakan'
        return 'Virtual COM Port'
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-semibold text-white flex items-center space-x-3">
                            <Usb className="w-7 h-7 text-blue-400" />
                            <span>Pilih COM Port</span>
                        </h2>
                        <p className="text-gray-400 mt-1">
                            Pilih port serial untuk timbangan digital
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleRefresh}
                            disabled={portsLoading}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-400 ${portsLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {portsLoading && availablePorts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                            <p className="text-gray-400">Memindai COM ports...</p>
                        </div>
                    ) : availablePorts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
                            <p className="text-gray-400 text-center">
                                Tidak ada COM port yang terdeteksi.<br />
                                Pastikan perangkat terhubung dengan benar.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availablePorts.map((port) => {
                                const testResult = testResults[port.name]
                                const isTesting = testingPort === port.name

                                return (
                                    <div
                                        key={port.name}
                                        className={`border-2 rounded-lg p-4 transition-all ${getPortStatusColor(port)} ${currentPort === port.name ? 'ring-2 ring-blue-500' : ''
                                            }`}
                                    >
                                        {/* Port Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                {port.isUSBSerial ? (
                                                    <Usb className="w-6 h-6 text-blue-400" />
                                                ) : (
                                                    <Cpu className="w-6 h-6 text-purple-400" />
                                                )}
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {port.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">
                                                        {port.friendlyName || port.description || 'Serial Port'}
                                                    </p>
                                                </div>
                                            </div>
                                            {getPortStatusIcon(port)}
                                        </div>

                                        {/* Port Details */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">Status:</span>
                                                <span className="text-white font-medium">
                                                    {getPortStatusText(port)}
                                                </span>
                                            </div>

                                            {port.manufacturer && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">Manufaktur:</span>
                                                    <span className="text-white">{port.manufacturer}</span>
                                                </div>
                                            )}

                                            {port.vid && port.pid && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">VID/PID:</span>
                                                    <span className="text-white font-mono">
                                                        {port.vid}:{port.pid}
                                                    </span>
                                                </div>
                                            )}

                                            {port.maxBaudRate > 0 && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">Max Baud:</span>
                                                    <span className="text-white">{port.maxBaudRate} bps</span>
                                                </div>
                                            )}

                                            {port.isVirtual && (
                                                <div className="flex items-center space-x-2 text-sm text-blue-400">
                                                    <Cpu className="w-4 h-4" />
                                                    <span>Virtual COM Port</span>
                                                </div>
                                            )}

                                            {port.requiresAdmin && (
                                                <div className="flex items-center space-x-2 text-sm text-yellow-400">
                                                    <Shield className="w-4 h-4" />
                                                    <span>Memerlukan hak administrator</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Test Result */}
                                        {testResult && (
                                            <div className={`mb-3 p-2 rounded text-sm ${testResult.success
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {testResult.success ? (
                                                    <div className="flex items-center space-x-2">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Port dapat digunakan</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <XCircle className="w-4 h-4" />
                                                        <span>Port tidak dapat diakses</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleTestPort(port.name)}
                                                disabled={isTesting}
                                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                                            >
                                                <TestTube className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`} />
                                                <span>{isTesting ? 'Testing...' : 'Test'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleSelectPort(port.name)}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                                            >
                                                Pilih
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 p-4 bg-gray-750">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>
                            {availablePorts.length} port terdeteksi
                        </span>
                        <span className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>Siap</span>
                            <span className="w-2 h-2 rounded-full bg-yellow-500 ml-3"></span>
                            <span>Admin</span>
                            <span className="w-2 h-2 rounded-full bg-red-500 ml-3"></span>
                            <span>Error</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default COMPortSelector
