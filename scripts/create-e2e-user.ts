// Prepares the E2E test data: the admin test user (test credentials only) and one `new` contact for the
// admin inbox test. Idempotent, so it can run before every local E2E run. Refuses to run in production.
import config from '@payload-config'
import { getPayload } from 'payload'

if (process.env.NEXT_PUBLIC_SITE_ENV === 'production') throw new Error('Refusing to create test users in production')
const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
if (!email || !password) throw new Error('E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD missing')

// One per Playwright project (desktop, mobile): the admin test runs in both, in parallel.
const INBOX_CONTACT_EMAILS = ['e2e-inbox-1@example.com', 'e2e-inbox-2@example.com']

const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
if (existing.totalDocs === 0) {
  await payload.create({ collection: 'users', data: { email, password, name: 'E2E Bot', role: 'admin' } })
}

// Ensure the inbox contacts exist and are `new` (each admin test run moves one to `in-progress`).
for (const inboxEmail of INBOX_CONTACT_EMAILS) {
  const found = await payload.find({ collection: 'contacts', overrideAccess: true, where: { email: { equals: inboxEmail } }, limit: 1 })
  const [contact] = found.docs
  if (contact) {
    await payload.update({ collection: 'contacts', id: contact.id, overrideAccess: true, data: { status: 'new' } })
  } else {
    await payload.create({
      collection: 'contacts',
      overrideAccess: true,
      data: {
        name: 'E2E Lead',
        email: inboxEmail,
        projectType: 'web',
        message: 'Automated E2E contact request for the inbox test.',
        privacyAccepted: true,
        status: 'new',
        locale: 'es',
      },
    })
  }
}
payload.logger.info('E2E user and inbox contacts ready')
process.exit(0)
