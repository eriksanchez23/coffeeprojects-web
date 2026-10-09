import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isAdminOrSelf, isTeam } from '@/access'
import { adminGroups, t } from '@/fields/labels'
import { firstUserIsAdmin } from '@/hooks/first-user-admin'
import { authCookies } from '@/lib/security/origins'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: t('Usuario', 'User'), plural: t('Usuarios', 'Users') },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: authCookies(),
  },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role'], group: adminGroups.team },
  access: { read: isTeam, create: isAdmin, update: isAdminOrSelf, delete: isAdmin },
  hooks: { beforeChange: [firstUserIsAdmin] },
  fields: [
    { name: 'name', type: 'text', label: t('Nombre', 'Name'), required: true },
    {
      name: 'role',
      type: 'select',
      label: t('Rol', 'Role'),
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: t('Administrador', 'Admin'), value: 'admin' },
        { label: t('Editor', 'Editor'), value: 'editor' },
      ],
      access: { update: isAdminField, create: isAdminField },
    },
  ],
}
