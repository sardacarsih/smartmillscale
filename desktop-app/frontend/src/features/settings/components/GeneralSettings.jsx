import { Globe, Clock, Calendar, Type } from 'lucide-react'
import useSettingsStore from '../store/useSettingsStore'

const GeneralSettings = () => {
  const {
    generalSettings,
    updateGeneralSettings
  } = useSettingsStore()

  const languages = [
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'en', label: 'English' }
  ]

  const timezones = [
    { value: 'Asia/Jakarta', label: 'Waktu Indonesia Barat (WIB)' },
    { value: 'Asia/Makassar', label: 'Waktu Indonesia Tengah (WITA)' },
    { value: 'Asia/Jayapura', label: 'Waktu Indonesia Timur (WIT)' }
  ]

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2023)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2023)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2023-12-31)' }
  ]

  const timeFormats = [
    { value: '24', label: '24 Jam (14:30)' },
    { value: '12', label: '12 Jam (2:30 PM)' }
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
          <Globe className="w-6 h-6 text-blue-400" />
          <span>Pengaturan Umum</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Site Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Informasi Situs</h3>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nama Aplikasi
              </label>
              <input
                type="text"
                value={generalSettings.siteName}
                onChange={(e) => updateGeneralSettings('siteName', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama aplikasi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Deskripsi Aplikasi
              </label>
              <textarea
                value={generalSettings.siteDescription}
                onChange={(e) => updateGeneralSettings('siteDescription', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Masukkan deskripsi aplikasi"
              />
            </div>
          </div>

          {/* Localization */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Lokalisasi</h3>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Bahasa
              </label>
              <select
                value={generalSettings.language}
                onChange={(e) => updateGeneralSettings('language', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Zona Waktu
              </label>
              <select
                value={generalSettings.timezone}
                onChange={(e) => updateGeneralSettings('timezone', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Format Tanggal
              </label>
              <select
                value={generalSettings.dateFormat}
                onChange={(e) => updateGeneralSettings('dateFormat', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dateFormats.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Format Waktu
              </label>
              <select
                value={generalSettings.timeFormat}
                onChange={(e) => updateGeneralSettings('timeFormat', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeFormats.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8 p-4 bg-gray-700/30 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Preview Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">
                {new Date().toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">
                {new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: generalSettings.timeFormat === '12'
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">
                {languages.find(l => l.value === generalSettings.language)?.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneralSettings