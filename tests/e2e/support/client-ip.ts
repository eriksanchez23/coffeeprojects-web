import { randomInt } from 'node:crypto'
import { test as base } from '@playwright/test'

/**
 * The contact action rate-limits by client IP (MAX_PER_HOUR saves per hashed `x-real-ip`). Every local
 * request comes from 127.0.0.1, so the specs that submit the form (× projects × retries × reruns within
 * the hour) would hit that limit. Each test gets its own random private address instead; the app reads
 * `x-real-ip` first (src/features/contact/ip.ts). On Vercel the platform overwrites the header, so the
 * staging smoke keeps the real limit.
 */
export const uniqueClientIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`

/** `test` for specs that submit the contact form: a fresh client IP per test (and per retry). */
export const test = base.extend({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, provide) => {
    await provide({ ...extraHTTPHeaders, 'x-real-ip': uniqueClientIp() })
  },
})

export { expect } from '@playwright/test'
