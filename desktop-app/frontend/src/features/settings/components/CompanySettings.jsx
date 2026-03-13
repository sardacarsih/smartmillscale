import { Building2, Ticket, Eye } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'

const CompanySettings = () => {
  const {
    companySettings,
    updateCompanySettings
  } = useSettingsStore()

  const dateFormats = [
    { value: 'YYYYMM', label: 'YYYYMM (202603)' },
    { value: 'YYMM', label: 'YYMM (2603)' }
  ]

  const digitOptions = [
    { value: 3, label: '3 digit (001)' },
    { value: 4, label: '4 digit (0001)' },
    { value: 5, label: '5 digit (00001)' }
  ]

  const separatorOptions = [
    { value: '-', label: 'Dash (-)' },
    { value: '/', label: 'Slash (/)' },
    { value: '.', label: 'Dot (.)' }
  ]

  // Generate ticket preview
  const getTicketPreview = () => {
    const prefix = companySettings.companyCode || 'SMS'
    const sep = companySettings.ticketSeparator || '-'
    const now = new Date()
    const digits = companySettings.ticketDigits || 4

    let dateStr
    if (companySettings.ticketDateFormat === 'YYMM') {
      dateStr = now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, '0')
    } else {
      dateStr = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0')
    }

    const seq = '1'.padStart(digits, '0')
    return `${prefix}${sep}${dateStr}${sep}${seq}`
  }

  return (
    <div className="p-6 space-y-8">
      {/* Company Information Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
          <Building2 className="w-6 h-6 text-blue-400" />
          <span>Informasi Perusahaan</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Kode Perusahaan
              </label>
              <input
                type="text"
                value={companySettings.companyCode}
                onChange={(e) => updateCompanySettings('companyCode', e.target.value.toUpperCase())}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: SMS"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">Digunakan sebagai prefix nomor tiket (huruf besar)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nama Perusahaan
              </label>
              <input
                type="text"
                value={companySettings.companyName}
                onChange={(e) => updateCompanySettings('companyName', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama perusahaan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Alamat Perusahaan
              </label>
              <textarea
                value={companySettings.companyAddress}
                onChange={(e) => updateCompanySettings('companyAddress', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Masukkan alamat perusahaan"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Telepon
              </label>
              <input
                type="text"
                value={companySettings.companyPhone}
                onChange={(e) => updateCompanySettings('companyPhone', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nomor telepon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email
              </label>
              <input
                type="text"
                value={companySettings.companyEmail}
                onChange={(e) => updateCompanySettings('companyEmail', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan email perusahaan"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Format Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
          <Ticket className="w-6 h-6 text-green-400" />
          <span>Format Nomor Tiket</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Format Tanggal
              </label>
              <select
                value={companySettings.ticketDateFormat}
                onChange={(e) => updateCompanySettings('ticketDateFormat', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dateFormats.map(fmt => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Jumlah Digit Urutan
              </label>
              <select
                value={companySettings.ticketDigits}
                onChange={(e) => updateCompanySettings('ticketDigits', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {digitOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Separator
              </label>
              <select
                value={companySettings.ticketSeparator}
                onChange={(e) => updateCompanySettings('ticketSeparator', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {separatorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ticket Preview */}
        <div className="mt-8 p-4 bg-gray-700/30 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Preview Nomor Tiket</span>
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-mono text-green-400 bg-gray-800 px-4 py-2 rounded-lg">
              {getTicketPreview()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanySettings
