import type { CollectionBeforeChangeHook, CollectionConfig, FieldAccess } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { projectImportEndpoint } from '@/endpoints/project-import'
import { adminGroups, t } from '@/fields/labels'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'
import { safeUrlValidator } from '@/lib/security/url'

/** NDA projects never store a public URL (`admin.condition` only hides the input, not the stored value). */
export const clearNdaUrl: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const nda = data?.nda ?? originalDoc?.nda
  if (nda === true && data) data.url = null
  return data
}

/** Field-level read access: a legacy NDA row's `url` is only returned to logged-in team users. */
export const ndaUrlReadAccess: FieldAccess = ({ req, doc }) => isTeam({ req }) === true || doc?.nda !== true

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: t('Proyecto', 'Project'), plural: t('Proyectos', 'Projects') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'status', 'featured', '_status'],
    group: adminGroups.content,
    preview: (doc, { locale }) => {
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      if (!slug) return null
      return previewUrl(buildPath('/projects/[slug]', (locale as Locale) ?? 'es', slug))
    },
  },
  hooks: {
    beforeChange: [clearNdaUrl],
    afterChange: [revalidateCollection('projects')],
    afterDelete: [revalidateCollectionDelete('projects')],
  },
  versions: { drafts: true },
  endpoints: [projectImportEndpoint],
  defaultSort: '-year',
  access: { read: publishedOrTeam, readVersions: isTeam, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'title', type: 'text', label: t('Título', 'Title'), required: true, localized: true },
    slugField('title'),
    { name: 'category', type: 'text', label: t('Categoría', 'Category'), required: true, localized: true },
    { name: 'summary', type: 'textarea', label: t('Resumen', 'Summary'), required: true, localized: true },
    { name: 'body', type: 'richText', label: t('Contenido', 'Body'), localized: true },
    { name: 'cover', type: 'upload', label: t('Portada', 'Cover'), relationTo: 'media' },
    { name: 'gallery', type: 'upload', label: t('Galería', 'Gallery'), relationTo: 'media', hasMany: true },
    { name: 'stack', type: 'text', label: t('Tecnologías', 'Stack'), hasMany: true },
    { name: 'year', type: 'number', label: t('Año', 'Year'), required: true },
    {
      name: 'status',
      type: 'select',
      label: t('Estado', 'Status'),
      enumName: 'enum_projects_project_status',
      required: true,
      defaultValue: 'live',
      options: [
        { label: t('En producción', 'Live'), value: 'live' },
        { label: t('En curso', 'In progress'), value: 'in-progress' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      label: t('URL', 'URL'),
      admin: { condition: (_, s) => !s?.nda },
      access: { read: ndaUrlReadAccess },
      validate: safeUrlValidator(),
    },
    {
      // S23: fills the empty fields (and the cover) from the website at `url`; no column, values go into the form.
      name: 'importFromUrl',
      type: 'ui',
      label: t('Importar desde la web', 'Import from website'),
      admin: { condition: (_, s) => !s?.nda, components: { Field: '/components/admin/project-import#ProjectImport' } },
    },
    { name: 'nda', type: 'checkbox', label: t('NDA', 'NDA'), defaultValue: false },
    { name: 'featured', type: 'checkbox', label: t('Destacado', 'Featured'), defaultValue: true },
    { name: 'team', type: 'relationship', label: t('Equipo', 'Team'), relationTo: 'team-members', hasMany: true },
    seoField(),
  ],
}
