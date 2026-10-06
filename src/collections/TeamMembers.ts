import type { CollectionConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'order', '_status'],
    group: 'Content',
    preview: (doc, { locale }) => {
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const path = buildPath('/team/[slug]', (locale as Locale) ?? 'es', slug)
      return `${process.env.NEXT_PUBLIC_SITE_URL}/next/preview?path=${encodeURIComponent(path)}&secret=${process.env.PREVIEW_SECRET}`
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
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'role', type: 'text', required: true, localized: true },
    { name: 'location', type: 'text', required: true, localized: true },
    { name: 'since', type: 'number', required: true, min: 2000, max: 2100 },
    { name: 'shortBio', type: 'textarea', required: true, localized: true, maxLength: 200 },
    { name: 'bio', type: 'textarea', required: true, localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'skills', type: 'text', hasMany: true },
    { name: 'available', type: 'checkbox', defaultValue: true },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    {
      name: 'github',
      type: 'group',
      fields: [
        { name: 'username', type: 'text' },
        {
          name: 'fallbackRepos',
          type: 'number',
          admin: { description: 'Shown if the GitHub API is unavailable.' },
        },
        { name: 'fallbackStars', type: 'number' },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'network',
          type: 'select',
          required: true,
          options: ['github', 'linkedin', 'twitch', 'x', 'instagram', 'website', 'email'].map((v) => ({ label: v, value: v })),
        },
        { name: 'url', type: 'text', required: true },
        { name: 'handle', type: 'text' },
      ],
    },
    seoField(),
  ],
}
