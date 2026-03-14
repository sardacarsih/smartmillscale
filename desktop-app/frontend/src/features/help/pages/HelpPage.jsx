import { useState } from 'react'
import {
  HelpCircle,
  Book,
  Settings,
  AlertTriangle,
  Keyboard,
  Monitor,
  ChevronRight,
  ChevronDown,
  Search,
  FileText,
  Users,
  Wrench
} from 'lucide-react'
import { useAuthStore } from '../../auth'
import { helpContent, getHelpByRole } from '../data/helpContent'
import { PageShell } from '../../../shared'

const HelpPage = ({ currentUser, wails, onNavigate, onLogout }) => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('quickstart')
  const [expandedSections, setExpandedSections] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const userGuide = getHelpByRole(user?.role)

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const filterContent = (content) => {
    if (!searchQuery.trim()) return content

    const query = searchQuery.toLowerCase()
    return content.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.content?.toLowerCase().includes(query) ||
      JSON.stringify(item).toLowerCase().includes(query)
    )
  }

  const tabs = [
    { id: 'quickstart', label: 'Mulai Cepat', icon: Book },
    { id: 'userguide', label: 'Panduan Pengguna', icon: Users },
    { id: 'troubleshooting', label: 'Pemecahan Masalah', icon: AlertTriangle },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'system', label: 'Informasi Sistem', icon: Monitor }
  ]

  return (
    <PageShell
      title="Smart Mill Scale"
      subtitle="Bantuan"
      currentUser={currentUser}
      onLogout={onLogout}
      onNavigate={onNavigate}
      pageTitle="Pusat Bantuan"
      pageDescription="Panduan, troubleshooting, dan referensi sistem yang tetap nyaman dibaca pada resolusi laptop maupun desktop."
      contentWidth="standard"
    >
      <div className="rounded-2xl border border-gray-700 bg-gray-800 px-4 py-4 sm:px-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bantuan..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
      </div>

      <div className="pt-6">
        {/* Tabs */}
        <div className="mb-8 overflow-x-auto border-b border-gray-700">
          <div className="flex min-w-max gap-1">
            {tabs.map(tab => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 whitespace-nowrap px-4 py-3 border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {/* Quick Start Tab */}
          {activeTab === 'quickstart' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {helpContent.quickStart.title}
              </h2>
              <div className="space-y-8">
                {filterContent(helpContent.quickStart.sections).map((section, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-lg font-semibold text-white mb-3">{section.title}</h3>
                    <p className="text-gray-300 mb-4">{section.content}</p>
                    {section.steps && (
                      <ol className="space-y-2">
                        {section.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {stepIndex + 1}
                            </span>
                            <span className="text-gray-300">{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Guide Tab */}
          {activeTab === 'userguide' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Panduan untuk {userGuide.title}</h2>
                <p className="text-gray-400">{userGuide.description}</p>
              </div>

              <div className="space-y-6">
                {userGuide.sections.map((section, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(`userguide-${index}`)}
                      className="w-full px-6 py-4 bg-gray-700/50 hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between"
                    >
                      <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                      {expandedSections[`userguide-${index}`] ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections[`userguide-${index}`] && (
                      <div className="px-6 py-4 border-t border-gray-700">
                        <p className="text-gray-300 mb-4">{section.content}</p>

                        {section.steps && (
                          <ol className="space-y-2">
                            {section.steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start space-x-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                  {stepIndex + 1}
                                </span>
                                <span className="text-gray-300">{step}</span>
                              </li>
                            ))}
                          </ol>
                        )}

                        {section.tips && (
                          <ul className="space-y-2">
                            {section.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="flex items-start space-x-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span className="text-gray-300">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {section.features && (
                          <ul className="space-y-2">
                            {section.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start space-x-3">
                                <span className="text-blue-400 mt-1">•</span>
                                <span className="text-gray-300">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Troubleshooting Tab */}
          {activeTab === 'troubleshooting' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {helpContent.troubleshooting.title}
              </h2>
              <div className="space-y-6">
                {filterContent(helpContent.troubleshooting.commonIssues).map((issue, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(`troubleshooting-${index}`)}
                      className="w-full px-6 py-4 bg-gray-700/50 hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between"
                    >
                      <h3 className="text-lg font-semibold text-white flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span>{issue.title}</span>
                      </h3>
                      {expandedSections[`troubleshooting-${index}`] ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections[`troubleshooting-${index}`] && (
                      <div className="px-6 py-4 border-t border-gray-700 space-y-4">
                        {/* Symptoms */}
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Gejala:</h4>
                          <ul className="space-y-1">
                            {issue.symptoms.map((symptom, symptomIndex) => (
                              <li key={symptomIndex} className="flex items-start space-x-2">
                                <span className="text-yellow-400 mt-1">•</span>
                                <span className="text-gray-300 text-sm">{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Solutions */}
                        <div>
                          <h4 className="text-sm font-semibold text-green-400 mb-2">Solusi:</h4>
                          <ol className="space-y-1">
                            {issue.solutions.map((solution, solutionIndex) => (
                              <li key={solutionIndex} className="flex items-start space-x-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                  {solutionIndex + 1}
                                </span>
                                <span className="text-gray-300 text-sm">{solution}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {helpContent.keyboardShortcuts.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpContent.keyboardShortcuts.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Keyboard className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{shortcut.description}</span>
                    </div>
                    <kbd className="px-3 py-1 bg-gray-900 border border-gray-600 rounded text-sm text-gray-300 font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Info Tab */}
          {activeTab === 'system' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {helpContent.systemInfo.title}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Persyaratan Sistem</h3>

                  <div className="space-y-4">
                    <div className="border border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">
                        {helpContent.systemInfo.requirements.minimum.title}
                      </h4>
                      <ul className="space-y-1">
                        {helpContent.systemInfo.requirements.minimum.items.map((item, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span className="text-gray-300 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-400 mb-2">
                        {helpContent.systemInfo.requirements.recommended.title}
                      </h4>
                      <ul className="space-y-1">
                        {helpContent.systemInfo.requirements.recommended.items.map((item, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span className="text-gray-300 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Version Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Informasi Versi</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Aplikasi</span>
                      <span className="text-gray-300 font-mono">{helpContent.systemInfo.versions.application}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Database</span>
                      <span className="text-gray-300 font-mono">{helpContent.systemInfo.versions.database}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Framework</span>
                      <span className="text-gray-300 font-mono">{helpContent.systemInfo.versions.framework}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Frontend</span>
                      <span className="text-gray-300 font-mono">{helpContent.systemInfo.versions.frontend}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Butuh Bantuan Tambahan?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Dokumentasi</p>
                <p className="text-gray-400 text-sm">Lihat dokumentasi lengkap</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Support Team</p>
                <p className="text-gray-400 text-sm">Hubungi tim support</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">IT Support</p>
                <p className="text-gray-400 text-sm">Bantuan teknis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export default HelpPage
