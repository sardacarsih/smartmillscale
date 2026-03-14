import {
  defineAuthenticatedLayoutSmokeSuite,
  loginWithCredentials
} from './support/authenticatedLayoutSmoke'

const adminPages = [
  { menuLabel: 'Dashboard', heading: /Admin Dashboard|Dashboard/i },
  { menuLabel: 'Timbang 1 PKS', heading: 'Penimbangan PKS' },
  { menuLabel: 'Laporan PKS', heading: 'Laporan PKS' },
  { menuLabel: 'Profil Saya', heading: 'Profil Saya' },
  { menuLabel: 'Bantuan', heading: 'Pusat Bantuan' },
  { menuLabel: 'Data Master', heading: 'Master Data' },
  { menuLabel: 'Pengaturan Sistem', heading: 'Konfigurasi Sistem' },
  { menuLabel: 'Manajemen Pengguna', heading: 'Manajemen Pengguna' },
  { menuLabel: 'Log Audit', heading: 'Riwayat Audit' },
  { menuLabel: 'Manajemen Sinkronisasi', heading: 'Kelola Sinkronisasi' }
]

defineAuthenticatedLayoutSmokeSuite({
  describeTitle: 'Desktop Layout Smoke Tests',
  testNamePrefix: 'admin desktop pages fit',
  pages: adminPages,
  bootstrap: (page) => loginWithCredentials(page, {
    username: 'admin',
    password: 'admin123',
    dashboardHeading: /Admin Dashboard|Dashboard/i
  })
})
