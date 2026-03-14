import {
  bootstrapDevRoleSession,
  createRoleUser,
  createTestSession,
  defineAuthenticatedLayoutSmokeSuite
} from './support/authenticatedLayoutSmoke'

const gradingPages = [
  { menuLabel: 'Dashboard', heading: 'Grading Dashboard' },
  { menuLabel: 'Profil Saya', heading: 'Profil Saya' },
  { menuLabel: 'Bantuan', heading: 'Pusat Bantuan' }
]

const gradingUser = createRoleUser({
  id: 'e2e-grading-1',
  username: 'grading',
  fullName: 'E2E Operator Grading',
  email: 'grading@example.com',
  role: 'GRADING'
})

defineAuthenticatedLayoutSmokeSuite({
  describeTitle: 'Grading Desktop Layout Smoke Tests',
  testNamePrefix: 'grading desktop pages fit',
  pages: gradingPages,
  bootstrap: (page) => bootstrapDevRoleSession(page, {
    user: gradingUser,
    session: createTestSession(gradingUser.id, 'e2e-session-grading', 'e2e-grading-token'),
    dashboardHeading: 'Grading Dashboard'
  })
})
