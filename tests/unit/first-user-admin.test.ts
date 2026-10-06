import { describe, expect, it, vi } from 'vitest'
import { firstUserIsAdmin } from '@/hooks/first-user-admin'

const run = (totalDocs: number, operation: 'create' | 'update', role = 'editor') =>
  firstUserIsAdmin({
    data: { role },
    operation,
    req: { payload: { count: vi.fn().mockResolvedValue({ totalDocs }) } },
  } as never)

describe('firstUserIsAdmin', () => {
  it('promotes the very first user to admin', async () => {
    expect((await run(0, 'create')).role).toBe('admin')
  })
  it('keeps the requested role for later users', async () => {
    expect((await run(2, 'create')).role).toBe('editor')
  })
  it('does nothing on update', async () => {
    expect((await run(0, 'update')).role).toBe('editor')
  })
})
