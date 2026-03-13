import { useEffect } from 'react'
import { useAuthStore } from '../../auth'
import useProfileStore from '../store/useProfileStore'
import ProfileInfo from '../components/ProfileInfo'
import ChangePassword from '../components/ChangePassword'
import { Topbar } from '../../../shared'

const ProfilePage = ({ currentUser, wails, onNavigate, onLogout }) => {
  const { user } = useAuthStore()
  const { setProfile } = useProfileStore()

  // Initialize profile data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        session: user.session
      })
    }
  }, [user, setProfile])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Topbar */}
      <Topbar
        title="Smart Mill Scale"
        subtitle="Profil Saya"
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div>
            <ProfileInfo />
          </div>

          {/* Change Password */}
          <div>
            <ChangePassword />
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Informasi Sesi</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-green-400 text-sm font-medium">Online</p>
              </div>
              {user?.session?.loginTime && (
                <div>
                  <p className="text-sm text-gray-400">Login Sejak</p>
                  <p className="text-gray-300 text-sm">
                    {new Date(user.session.loginTime).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">IP Address</p>
                <p className="text-gray-300 text-sm">127.0.0.1</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Aktivitas</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Total Timbangan</p>
                <p className="text-gray-300 text-2xl font-bold">0</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Hari Ini</p>
                <p className="text-gray-300 text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Sistem</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Versi Aplikasi</p>
                <p className="text-gray-300 text-sm">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Database</p>
                <p className="text-gray-300 text-sm">SQLite</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Sinkronisasi</p>
                <p className="text-green-400 text-sm font-medium">Aktif</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage