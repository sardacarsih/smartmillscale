import { useState, useRef, useEffect } from 'react'
import { User, LogOut, Shield, Settings, Clock, ChevronDown, HelpCircle, Users, Grid3X3, Scale3D, Scale, Leaf, Database, RefreshCw, FileText } from 'lucide-react'

const UserBadge = ({ user, onLogout, onNavigate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!user) {
    return null
  }

  // Role configuration
  const roleConfig = {
    'ADMIN': { color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Administrator' },
    'SUPERVISOR': { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Supervisor' },
    'TIMBANGAN': { color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Operator Timbangan' },
    'GRADING': { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Operator Grading' }
  }

  const userRole = roleConfig[user.role] || roleConfig['TIMBANGAN']

  // Format session time
  const formatSessionTime = (timestamp) => {
    if (!timestamp) return ''
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return ''
    }
  }

  const handleLogout = () => {
    setIsDropdownOpen(false)
    if (onLogout) {
      onLogout()
    }
  }

  const handleNavigation = (page) => {
    console.log('🔍 UserBadge: handleNavigation called with page:', page)
    console.log('🔍 UserBadge: Current user role:', user?.role)
    console.log('🔍 UserBadge: onNavigate function exists:', !!onNavigate)

    setIsDropdownOpen(false)
    if (onNavigate) {
      console.log('🔍 UserBadge: Calling onNavigate with page:', page)
      onNavigate(page)
    } else {
      console.warn('🔍 UserBadge: onNavigate is not available!')
    }
  }

  // Get icon component by name
  const getIcon = (iconName) => {
    const icons = {
      User,
      LogOut,
      Shield,
      Settings,
      Clock,
      HelpCircle,
      Users,
      Grid3X3,
      Scale3D,
      Scale,
      Leaf,
      Database,
      RefreshCw,
      FileText
    }
    return icons[iconName] || User
  }

  // Get navigation items for current user role
  const getNavigationItems = () => {
    const allItems = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: 'Grid3X3',
        roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING']
      },
      {
        key: 'timbang1',
        label: 'Timbang 1 PKS',
        icon: 'Scale',
        roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN']
      },
      {
        key: 'master-data',
        label: 'Data Master',
        icon: 'Database',
        roles: ['ADMIN', 'SUPERVISOR']
      },
      {
        key: 'pks-reports',
        label: 'Laporan PKS',
        icon: 'FileText',
        roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN']
      },
      {
        key: 'sync-management',
        label: 'Manajemen Sinkronisasi',
        icon: 'RefreshCw',
        roles: ['ADMIN']
      },
      {
        key: 'profile',
        label: 'Profil Saya',
        icon: 'User',
        roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING']
      },
      {
        key: 'help',
        label: 'Bantuan',
        icon: 'HelpCircle',
        roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING']
      },
      {
        key: 'settings',
        label: 'Pengaturan Sistem',
        icon: 'Settings',
        roles: ['ADMIN']
      },
      {
        key: 'users',
        label: 'Manajemen Pengguna',
        icon: 'Users',
        roles: ['ADMIN']
      },
      {
        key: 'audit',
        label: 'Log Audit',
        icon: 'Shield',
        roles: ['ADMIN', 'SUPERVISOR']
      }
    ]

    return allItems.filter(item => item.roles.includes(user?.role))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Badge Button */}
      <button
        id="user-menu-button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        className="flex max-w-full items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/80 px-3 py-2 transition-all duration-200 hover:bg-gray-800/90 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4"
      >
        {/* User Avatar */}
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-300" />
        </div>

        {/* User Info */}
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
          <p className="hidden truncate text-xs text-gray-400 sm:block">{userRole.label}</p>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
          isDropdownOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div
          role="menu"
          aria-labelledby="user-menu-button"
          className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-gray-600 bg-gray-800 shadow-xl z-50"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-300" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{user.fullName}</p>
                <p className="text-gray-400 text-sm">{user.username}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${userRole.bgColor} ${userRole.color}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {userRole.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Login: {formatSessionTime(user.session?.loginTime)}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Dynamic Navigation Items */}
            {getNavigationItems().map((item) => {
              const IconComponent = getIcon(item.icon)
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavigation(item.key)}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 flex items-center space-x-3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  role="menuitem"
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}

            <div className="border-t border-gray-700 my-2"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center space-x-3 transition-colors duration-150"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserBadge
