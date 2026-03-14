import {
  bootstrapDevRoleSession,
  createRoleUser,
  createTestSession,
  defineAuthenticatedLayoutSmokeSuite
} from './support/authenticatedLayoutSmoke'

const supervisorPages = [
  { menuLabel: 'Dashboard', heading: 'Supervisor Dashboard' },
  { menuLabel: 'Timbang 1 PKS', heading: 'Penimbangan PKS' },
  { menuLabel: 'Laporan PKS', heading: 'Laporan PKS' },
  { menuLabel: 'Profil Saya', heading: 'Profil Saya' },
  { menuLabel: 'Bantuan', heading: 'Pusat Bantuan' },
  { menuLabel: 'Data Master', heading: 'Master Data' },
  { menuLabel: 'Log Audit', heading: 'Riwayat Audit' }
]

const supervisorUser = createRoleUser({
  id: 'e2e-supervisor-1',
  username: 'supervisor',
  fullName: 'E2E Supervisor',
  email: 'supervisor@example.com',
  role: 'SUPERVISOR'
})

defineAuthenticatedLayoutSmokeSuite({
  describeTitle: 'Supervisor Desktop Layout Smoke Tests',
  testNamePrefix: 'supervisor desktop pages fit',
  pages: supervisorPages,
  bootstrap: (page) => bootstrapDevRoleSession(page, {
    user: supervisorUser,
    session: createTestSession(supervisorUser.id, 'e2e-session-supervisor', 'e2e-supervisor-token'),
    dashboardHeading: 'Supervisor Dashboard'
  })
})
