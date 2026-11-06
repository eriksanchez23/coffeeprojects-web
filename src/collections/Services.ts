import type { CollectionConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { projectTypes } from '@/features/contact/options'
import { adminGroups, bilingualOptions, projectTypeLabels, serviceIconLabels, t } from '@/fields/labels'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'

export const serviceIcons = ['globe', 'refresh', 'shopping-cart', 'code', 'server', 'bot', 'wrench', 'sparkles'] as const
/** `web` = main website line (home, /services, menu); `other` = "Other development" page only. */
export const serviceLines = ['web', 'other'] as const

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: t('Servicio', 'Service'), plural: t('Servicios', 'Services') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'line', 'typicalTime', 'order', '_status'],
    group: adminGroups.content,
    preview: (doc, { locale }) => {
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      if (!slug) return null
      return previewUrl(buildPath('/services/[slug]', (locale as Locale) ?? 'es', slug))
    },
  },
  hooks: {
    afterChange: [revalidateCollection('services')],
    afterDelete: [revalidateCollectionDelete('services')],
  },
  versions: { drafts: true },
  defaultSort: 'order',
  access: { read: publishedOrTeam, readVersions: isTeam, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'title', type: 'text', label: t('Título', 'Title'), required: true, localized: true },
    slugField('title'),
    {
      name: 'promise',
      type: 'text',
      label: t('Promesa', 'Promise'),
      required: true,
      localized: true,
      admin: { description: t('Titular principal de la landing', 'Landing hero headline') },
    },
    { name: 'summary', type: 'textarea', label: t('Resumen', 'Summary'), required: true, localized: true },
    { name: 'body', type: 'richText', label: t('Contenido', 'Body'), localized: true },
    {
      name: 'icon',
      type: 'select',
      label: t('Icono', 'Icon'),
      required: true,
      options: bilingualOptions(serviceIcons, serviceIconLabels),
    },
    {
      name: 'contactType',
      type: 'select',
      label: t('Tipo de contacto', 'Contact type'),
      required: true,
      options: bilingualOptions(projectTypes, projectTypeLabels),
      admin: {
        description: t(
          'Preselecciona este tipo de proyecto en el formulario de contacto',
          'Pre-selects this project type in the contact form',
        ),
      },
    },
    {
      name: 'pricing',
      type: 'group',
      label: t('Precios', 'Pricing'),
      fields: [
        {
          name: 'mode',
          type: 'select',
          label: t('Modalidad', 'Mode'),
          required: true,
          defaultValue: 'one-off',
          options: [
            { label: t('Pago único desde', 'One-off price from'), value: 'one-off' },
            { label: t('Cuota mensual desde', 'Monthly price from'), value: 'monthly' },
            { label: t('Presupuesto a medida', 'Custom quote'), value: 'custom' },
            { label: t('Tienda externa', 'External store'), value: 'store' },
          ],
        },
        {
          name: 'amount',
          type: 'number',
          label: t('Importe', 'Amount'),
          min: 0,
          admin: { condition: (_, s) => s?.mode === 'one-off' || s?.mode === 'monthly' },
        },
        {
          name: 'storeUrl',
          type: 'text',
          label: t('URL de la tienda', 'Store URL'),
          admin: { condition: (_, s) => s?.mode === 'store' },
        },
      ],
    },
    { name: 'typicalTime', type: 'text', label: t('Plazo habitual', 'Typical time'), required: true, localized: true },
    { name: 'tags', type: 'text', label: t('Etiquetas', 'Tags'), hasMany: true },
    {
      name: 'features',
      type: 'array',
      label: t('Características', 'Features'),
      labels: { singular: t('Característica', 'Feature'), plural: t('Características', 'Features') },
      localized: true,
      fields: [{ name: 'text', type: 'text', label: t('Texto', 'Text'), required: true }],
    },
    { name: 'note', type: 'text', label: t('Nota', 'Note'), localized: true },
    {
      name: 'faq',
      type: 'array',
      label: t('Preguntas frecuentes', 'FAQ'),
      labels: { singular: t('Pregunta', 'Question'), plural: t('Preguntas', 'Questions') },
      localized: true,
      fields: [
        { name: 'question', type: 'text', label: t('Pregunta', 'Question'), required: true },
        { name: 'answer', type: 'textarea', label: t('Respuesta', 'Answer'), required: true },
      ],
    },
    {
      name: 'line',
      type: 'select',
      label: t('Línea', 'Line'),
      required: true,
      defaultValue: 'web',
      options: [
        { label: t('Webs (principal: portada, menú y servicios)', 'Websites (main: home, menu and services)'), value: 'web' },
        { label: t('Otros desarrollos (solo en su página)', 'Other development (its own page only)'), value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'order', type: 'number', label: t('Orden', 'Order'), defaultValue: 0, admin: { position: 'sidebar' } },
    seoField(),
  ],
}
