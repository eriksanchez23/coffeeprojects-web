import { describe, expect, it } from 'vitest'
import { isAdmin, isTeam, nobody, publishedOrTeam } from '@/access'

const args = (user?: { role: 'admin' | 'editor' }) => ({ req: { user } }) as never

describe('access', () => {
  it('isAdmin only for admin role', () => {
    expect(isAdmin(args({ role: 'admin' }))).toBe(true)
    expect(isAdmin(args({ role: 'editor' }))).toBe(false)
    expect(isAdmin(args())).toBe(false)
  })
  it('isTeam for any logged-in user', () => {
    expect(isTeam(args({ role: 'editor' }))).toBe(true)
    expect(isTeam(args())).toBe(false)
  })
  it('publishedOrTeam returns a published filter for the public', () => {
    expect(publishedOrTeam(args())).toEqual({ _status: { equals: 'published' } })
    expect(publishedOrTeam(args({ role: 'editor' }))).toBe(true)
  })
  it('nobody always denies', () => {
    expect(nobody(args({ role: 'admin' }))).toBe(false)
  })
})
