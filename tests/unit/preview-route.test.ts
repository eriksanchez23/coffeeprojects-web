import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// S11: draft preview is for the team only; an API-key integration user must not enable draft mode.
const state = vi.hoisted(() => ({ user: null as unknown, enabled: false }))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: async () => ({ auth: async () => ({ user: state.user }) }) }))
vi.mock('next/headers', () => ({ draftMode: async () => ({ enable: () => void (state.enabled = true) }) }))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { path })
  },
}))

const { GET } = await import('@/app/(frontend)/next/preview/route')

const request = () => new Request('http://localhost:3000/next/preview?secret=s3cret&path=/servicios')

async function run() {
  try {
    const res = await GET(request())
    return { status: res.status, redirect: null as string | null }
  } catch (e) {
    return { status: 307, redirect: (e as { path?: string }).path ?? null }
  }
}

describe('GET /next/preview', () => {
  beforeEach(() => {
    vi.stubEnv('PREVIEW_SECRET', 's3cret')
    state.enabled = false
  })
  afterEach(() => vi.unstubAllEnvs())

  it.each(['admin', 'editor'])('enables draft mode for %s', async (role) => {
    state.user = { id: 1, role }
    expect(await run()).toEqual({ status: 307, redirect: '/servicios' })
    expect(state.enabled).toBe(true)
  })

  it.each([
    ['anonymous', null],
    ['integration', { id: 3, role: 'integration' }],
    ['a user without a role', { id: 4 }],
  ])('refuses %s', async (_name, user) => {
    state.user = user
    expect((await run()).status).toBe(403)
    expect(state.enabled).toBe(false)
  })
})
