import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory stand-ins for Next's data cache, draft mode and the Payload Local API.
const state = vi.hoisted(() => ({
  draft: false,
  user: null as null | { id: number },
  store: new Map<string, unknown>(),
  docs: [] as Record<string, unknown>[],
  finds: [] as Record<string, unknown>[],
}))

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({ unstable_rethrow: () => {} }))
vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: state.draft }),
  headers: async () => new Headers({ cookie: 'payload-token=x' }),
}))
vi.mock('next/cache', () => ({
  unstable_cache:
    (fn: () => Promise<unknown>, key: string[]) =>
    async () => {
      const k = key.join('|')
      if (state.store.has(k)) return state.store.get(k)
      const result = await fn() // like Next: nothing is stored when fn throws
      state.store.set(k, result)
      return result
    },
}))
vi.mock('@/lib/cms/client', () => ({
  payloadClient: async () => ({
    auth: async () => ({ user: state.user }),
    find: async (args: Record<string, unknown>) => {
      state.finds.push(args)
      return { docs: state.docs }
    },
    findByID: async () => ({ id: 1, slug: { es: 'hola' } }),
    findGlobal: async () => ({}),
  }),
}))

const { getProject } = await import('@/lib/cms/queries')

beforeEach(() => {
  state.draft = false
  state.user = null
  state.store.clear()
  state.docs = []
  state.finds = []
})

describe('findBySlug cache', () => {
  it('does not persist a cache entry for a missing slug', async () => {
    expect(await getProject('es', 'does-not-exist')).toBeNull()
    expect(state.store.size).toBe(0)
  })

  it('still caches a published document', async () => {
    state.docs = [{ id: 1, slug: 'hola' }]
    expect((await getProject('es', 'hola'))?.doc).toEqual({ id: 1, slug: 'hola' })
    expect(state.store.size).toBe(1)
  })
})
