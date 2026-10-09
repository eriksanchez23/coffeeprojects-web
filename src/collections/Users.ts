import type { CollectionConfig } from 'payload'
import { canManageContacts, hasTeamRole, isAdmin, isAdminField, isAdminOrSelf, isTeam, isTeamField } from '@/access'
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
    // S11: `Authorization: users API-Key <key>` for integrations (Discord bot, internal panel). Only admins
    // can enable or rotate a key (see the `apiKey` field below).
    useAPIKey: true,
  },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role'], group: adminGroups.team },
  access: {
    // Integrations read users only to assign contact requests (role and API-key state stay hidden from them).
    read: canManageContacts,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    unlock: isTeam,
    // The admin panel is for people: integration users authenticate with an API key against REST only.
    admin: ({ req }) => hasTeamRole(req.user),
  },
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
        // S11: API-key machine user (Discord bot, internal panel) that only manages contact requests.
        { label: t('Integración', 'Integration'), value: 'integration' },
      ],
      access: { read: isTeamField, update: isAdminField, create: isAdminField },
    },
    // Overrides of Payload's API-key fields (merged with its base fields, hooks kept). Payload lets anyone with
    // admin-panel access set their own key; here only admins enable, rotate or see the state of a key, and
    // Payload copies this access to `enableAPIKey`, `apiKeyIndex` and the virtual `hasAPIKey`.
    { name: 'apiKey', type: 'text', access: { create: isAdminField, update: isAdminField } },
    { name: 'enableAPIKey', type: 'checkbox', access: { read: isAdminField } },
  ],
}
