import {
  bootstrapDevRoleSession,
  createRoleUser,
  createTestSession,
  defineAuthenticatedLayoutSmokeSuite
} from './support/authenticatedLayoutSmoke'

const timbangPages = [
  { menuLabel: 'Dashboard', heading: 'Weighing Dashboard' },
  { menuLabel: 'Timbang 1 PKS', heading: 'Penimbangan PKS' },
  { menuLabel: 'Laporan PKS', heading: 'Laporan PKS' },
  { menuLabel: 'Profil Saya', heading: 'Profil Saya' },
  { menuLabel: 'Bantuan', heading: 'Pusat Bantuan' }
]

const timbangUser = createRoleUser({
  id: 'e2e-timbangan-1',
  username: 'operator',
  fullName: 'E2E Operator Timbangan',
  email: 'operator@example.com',
  role: 'TIMBANGAN'
})

defineAuthenticatedLayoutSmokeSuite({
  describeTitle: 'Timbangan Desktop Layout Smoke Tests',
  testNamePrefix: 'timbangan desktop pages fit',
  pages: timbangPages,
  bootstrap: (page) => bootstrapDevRoleSession(page, {
    user: timbangUser,
    session: createTestSession(timbangUser.id, 'e2e-session-timbangan', 'e2e-timbangan-token'),
    dashboardHeading: 'Weighing Dashboard'
  })
})
