import { request, type FullConfig } from '@playwright/test'
import { resetE2EContacts } from './contacts'

/**
 * Global setup and teardown: resets the E2E contacts before the run (clean rate-limit window, inbox contacts
 * back to `new`) and after it (no submitted test rows left behind). Runs once, in one process: concurrent admin
 * logins from several workers race on the user's session list and invalidate each other's tokens.
 */
export default async function cleanup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL
  const ctx = await request.newContext({ baseURL })
  try {
    await resetE2EContacts(ctx)
  } finally {
    await ctx.dispose()
  }
}
