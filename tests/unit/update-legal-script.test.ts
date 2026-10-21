import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { legal } from '@/seed/data/legal'

// scripts/update-legal.ts runs on import (like every `payload run` script): mock Payload and the process.
const calls = { updateGlobal: vi.fn(), other: vi.fn() }
const info = vi.fn()
const fakePayload = new Proxy(
  { updateGlobal: calls.updateGlobal, logger: { info, error: vi.fn() } } as Record<string, unknown>,
  { get: (t, k: string) => (k in t || k === 'then' ? t[k] : (calls.other(k), vi.fn())) },
)
vi.mock('payload', () => ({ getPayload: async () => fakePayload }))
vi.mock('@payload-config', () => ({ default: {} }))

const run = async (env: Record<string, string | undefined> = {}) => {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  await import('../../scripts/update-legal')
}

beforeEach(() => {
  calls.updateGlobal.mockReset()
  calls.other.mockReset()
  info.mockReset()
  vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
})
afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.LEGAL_UPDATE_DRY_RUN
})

describe('scripts/update-legal.ts', () => {
  it('updates only the legal global, one call per locale, with the three seeded texts and nothing else', async () => {
    await run()
    expect(calls.updateGlobal).toHaveBeenCalledTimes(3)
    for (const locale of ['es', 'en', 'fr'] as const) {
      expect(calls.updateGlobal).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'legal', locale, overrideAccess: true, data: legal[locale] }),
      )
    }
    for (const [arg] of calls.updateGlobal.mock.calls) expect(Object.keys(arg.data).sort()).toEqual(['cookiePolicy', 'legalNotice', 'privacyPolicy'])
    expect(calls.other).not.toHaveBeenCalled()
  })

  it('never writes companyComplete and logs counts only', async () => {
    await run()
    for (const [arg] of calls.updateGlobal.mock.calls) expect(arg.data).not.toHaveProperty('companyComplete')
    const logged = info.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toMatch(/updated 3 locales/)
    expect(logged).not.toMatch(/Juan|@/)
  })

  it('writes nothing in dry-run mode', async () => {
    await run({ LEGAL_UPDATE_DRY_RUN: '1' })
    expect(calls.updateGlobal).not.toHaveBeenCalled()
    expect(info.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(/dry run/)
  })
})
