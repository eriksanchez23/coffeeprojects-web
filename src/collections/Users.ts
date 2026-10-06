import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isTeam } from '@/access'
import { firstUserIsAdmin } from '@/hooks/first-user-admin'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: { tokenExpiration: 60 * 60 * 8, maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role'], group: 'Team' },
  access: { read: isTeam, create: isAdmin, update: isTeam, delete: isAdmin },
  hooks: { beforeChange: [firstUserIsAdmin] },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { update: isAdminField, create: isAdminField },
    },
  ],
}
