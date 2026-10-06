import type { Access, FieldAccess, Where } from 'payload'

type Role = 'admin' | 'editor'
type MaybeUser = { role?: Role } | null | undefined

const roleOf = (user: unknown): Role | undefined => (user as MaybeUser)?.role

export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin'
export const isTeam: Access = ({ req: { user } }) => Boolean(user)
export const nobody: Access = () => false
export const isAdminField: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin'

const published: Where = { _status: { equals: 'published' } }
export const publishedOrTeam: Access = ({ req: { user } }) => (user ? true : published)
