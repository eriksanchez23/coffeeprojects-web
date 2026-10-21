import { describe, expect, it } from 'vitest'
import { canManageContacts, isAdmin, isAdminOrSelf, isTeam, nobody, publishedOrTeam } from '@/access'

const args = (user?: { id?: number; role?: string }) => ({ req: { user } }) as never

describe('access', () => {
  it('isAdmin only for admin role', () => {
    expect(isAdmin(args({ role: 'admin' }))).toBe(true)
    expect(isAdmin(args({ role: 'editor' }))).toBe(false)
    expect(isAdmin(args())).toBe(false)
  })
  it('isTeam only for admin and editor roles (S11: not for integration or role-less users)', () => {
    expect(isTeam(args({ role: 'admin' }))).toBe(true)
    expect(isTeam(args({ role: 'editor' }))).toBe(true)
    expect(isTeam(args({ role: 'integration' }))).toBe(false)
    expect(isTeam(args({ id: 9 }))).toBe(false)
    expect(isTeam(args())).toBe(false)
  })
  it('canManageContacts for admin, editor and integration', () => {
    for (const role of ['admin', 'editor', 'integration']) expect(canManageContacts(args({ role })), role).toBe(true)
    expect(canManageContacts(args({ id: 9 }))).toBe(false)
    expect(canManageContacts(args())).toBe(false)
  })
  it('isAdminOrSelf: admin anyone, editor self, integration nothing', () => {
    expect(isAdminOrSelf(args({ id: 1, role: 'admin' }))).toBe(true)
    expect(isAdminOrSelf(args({ id: 2, role: 'editor' }))).toEqual({ id: { equals: 2 } })
    expect(isAdminOrSelf(args({ id: 3, role: 'integration' }))).toBe(false)
    expect(isAdminOrSelf(args())).toBe(false)
  })
  it('publishedOrTeam returns a published filter for the public', () => {
    expect(publishedOrTeam(args())).toEqual({ _status: { equals: 'published' } })
    expect(publishedOrTeam(args({ role: 'editor' }))).toBe(true)
    expect(publishedOrTeam(args({ role: 'integration' }))).toEqual({ _status: { equals: 'published' } })
  })
  it('nobody always denies', () => {
    expect(nobody(args({ role: 'admin' }))).toBe(false)
  })
})
