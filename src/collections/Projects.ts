import type { CollectionConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'status', 'featured', '_status'],
    group: 'Content',
    preview: (doc, { locale }) => {
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      if (!slug) return null
      return previewUrl(buildPath('/projects/[slug]', (locale as Locale) ?? 'es', slug))
    },
  },
  hooks: {
    afterChange: [revalidateCollection('projects')],
    afterDelete: [revalidateCollectionDelete('projects')],
  },
  versions: { drafts: true },
  defaultSort: '-year',
  access: { read: publishedOrTeam, readVersions: isTeam, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField('title'),
    { name: 'category', type: 'text', required: true, localized: true },
    { name: 'summary', type: 'textarea', required: true, localized: true },
    { name: 'body', type: 'richText', localized: true },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'stack', type: 'text', hasMany: true },
    { name: 'year', type: 'number', required: true },
    {
      name: 'status',
      type: 'select',
      enumName: 'enum_projects_project_status',
      required: true,
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'In progress', value: 'in-progress' },
      ],
    },
    { name: 'url', type: 'text', admin: { condition: (_, s) => !s?.nda } },
    { name: 'nda', type: 'checkbox', defaultValue: false },
    { name: 'featured', type: 'checkbox', defaultValue: true },
    { name: 'team', type: 'relationship', relationTo: 'team-members', hasMany: true },
    seoField(),
  ],
}
