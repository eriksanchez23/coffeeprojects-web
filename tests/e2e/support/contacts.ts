import type { APIRequestContext } from '@playwright/test'

/** Every contact the E2E suite submits uses this address prefix/domain, so cleanup never touches real leads. */
export const E2E_CONTACT_DOMAIN = 'e2e.coffeeprojects.test'
export const e2eContactEmail = (tag: string) => `pw-${tag}-${Date.now()}@${E2E_CONTACT_DOMAIN}`

/** Inbox contacts created by `pnpm e2e:user` for the admin test (scripts/create-e2e-user.ts). */
const INBOX_CONTACT_PREFIX = 'e2e-inbox-'

async function adminToken(request: APIRequestContext): Promise<string | null> {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  if (!email || !password) return null
  const login = await request.post('/api/users/login', { data: { email, password } })
  if (!login.ok()) throw new Error(`E2E data: admin login failed (${login.status()})`)
  return ((await login.json()) as { token: string }).token
}

/**
 * Resets the E2E data through the REST API, once per run (global setup/teardown, see cleanup.ts):
 * - deletes the contacts the suite submitted (this also frees the 5/hour/IP contact rate limit, which counts rows);
 * - moves the admin-inbox contacts back to `new`, so the admin test can run again.
 * Needs the local admin test credentials; without them (e.g. CI without secrets) it is a no-op, which is fine
 * because CI starts from a fresh database seeded by `pnpm e2e:user`.
 */
export async function resetE2EContacts(request: APIRequestContext): Promise<void> {
  const token = await adminToken(request)
  if (!token) return
  const headers = { Authorization: `JWT ${token}` }
  const del = await request.delete(`/api/contacts?where[email][like]=${encodeURIComponent(E2E_CONTACT_DOMAIN)}`, { headers })
  if (!del.ok()) throw new Error(`E2E data: deleting test contacts failed (${del.status()})`)
  const patch = await request.patch(`/api/contacts?where[email][like]=${encodeURIComponent(INBOX_CONTACT_PREFIX)}`, {
    headers,
    data: { status: 'new' },
  })
  if (!patch.ok()) throw new Error(`E2E data: resetting inbox contacts failed (${patch.status()})`)
}
