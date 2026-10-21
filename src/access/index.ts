import type { Access, FieldAccess, Where } from 'payload'

/**
 * Roles (Users.role). `integration` is for API-key machine users (Discord bot, internal panel, S11): they only
 * manage contact requests and never reach content, media, the admin panel or draft preview.
 */
export const roles = ['admin', 'editor', 'integration'] as const
export type Role = (typeof roles)[number]
type MaybeUser = { id?: number | string; role?: unknown } | null | undefined

export const roleOf = (user: unknown): Role | undefined => {
  const role = (user as MaybeUser)?.role
  return roles.includes(role as Role) ? (role as Role) : undefined
}

/** Admin or editor: people who edit content and use the admin panel. Fails closed for unknown roles. */
export const hasTeamRole = (user: unknown): boolean => {
  const role = roleOf(user)
  return role === 'admin' || role === 'editor'
}
/** Team or integration: who may read contacts and update their status/assignment/notes. */
export const canManageContactsRole = (user: unknown): boolean => hasTeamRole(user) || roleOf(user) === 'integration'

export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin'
export const isTeam: Access = ({ req: { user } }) => hasTeamRole(user)
export const canManageContacts: Access = ({ req: { user } }) => canManageContactsRole(user)
/** Admins update anyone; editors only themselves; integration users not even themselves. */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (roleOf(user) === 'admin') return true
  if (roleOf(user) === 'editor') return { id: { equals: user.id } }
  return false
}
export const nobody: Access = () => false
export const isAdminField: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin'
export const isTeamField: FieldAccess = ({ req: { user } }) => hasTeamRole(user)

const published: Where = { _status: { equals: 'published' } }
export const publishedOrTeam: Access = ({ req: { user } }) => (hasTeamRole(user) ? true : published)
