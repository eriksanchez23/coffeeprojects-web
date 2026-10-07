import type { CollectionConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { adminGroups, bilingualOptions, socialNetworkLabels, t } from '@/fields/labels'
import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  labels: { singular: t('Miembro del equipo', 'Team member'), plural: t('Miembros del equipo', 'Team members') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'order', '_status'],
    group: adminGroups.content,
    preview: (doc, { locale }) => {
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      if (!slug) return null
      return previewUrl(buildPath('/team/[slug]', (locale as Locale) ?? 'es', slug))
    },
  },
  hooks: {
    afterChange: [revalidateCollection('team-members')],
    afterDelete: [revalidateCollectionDelete('team-members')],
  },
  versions: { drafts: true },
  defaultSort: 'order',
  access: { read: publishedOrTeam, readVersions: isTeam, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'name', type: 'text', label: t('Nombre', 'Name'), required: true },
    slugField('name'),
    { name: 'role', type: 'text', label: t('Cargo', 'Role'), required: true, localized: true },
    { name: 'location', type: 'text', label: t('Ubicación', 'Location'), required: true, localized: true },
    { name: 'since', type: 'number', label: t('Desde', 'Since'), required: true, min: 2000, max: 2100 },
    { name: 'shortBio', type: 'textarea', label: t('Biografía corta', 'Short bio'), required: true, localized: true, maxLength: 200 },
    { name: 'bio', type: 'textarea', label: t('Biografía', 'Bio'), required: true, localized: true },
    { name: 'photo', type: 'upload', label: t('Foto', 'Photo'), relationTo: 'media' },
    { name: 'skills', type: 'text', label: t('Habilidades', 'Skills'), hasMany: true },
    { name: 'available', type: 'checkbox', label: t('Disponible', 'Available'), defaultValue: true },
    { name: 'order', type: 'number', label: t('Orden', 'Order'), defaultValue: 0, admin: { position: 'sidebar' } },
    {
      name: 'github',
      type: 'group',
      label: t('GitHub', 'GitHub'),
      fields: [
        { name: 'username', type: 'text', label: t('Usuario', 'Username') },
        {
          name: 'fallbackRepos',
          type: 'number',
          label: t('Repositorios (respaldo)', 'Fallback repos'),
          admin: { description: t('Se muestra si la API de GitHub no está disponible.', 'Shown if the GitHub API is unavailable.') },
        },
        { name: 'fallbackStars', type: 'number', label: t('Estrellas (respaldo)', 'Fallback stars') },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      label: t('Redes sociales', 'Social links'),
      labels: { singular: t('Red social', 'Social link'), plural: t('Redes sociales', 'Social links') },
      fields: [
        {
          name: 'network',
          type: 'select',
          label: t('Red', 'Network'),
          required: true,
          options: bilingualOptions(['github', 'linkedin', 'twitch', 'x', 'instagram', 'website', 'email'], socialNetworkLabels),
        },
        { name: 'url', type: 'text', label: t('URL', 'URL'), required: true },
        { name: 'handle', type: 'text', label: t('Usuario o alias', 'Handle') },
      ],
    },
    seoField(),
  ],
}
