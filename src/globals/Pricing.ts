import type { GlobalConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { PLAN_SLUG } from '@/features/contact/plan'
import { adminGroups, t } from '@/fields/labels'
import { seoField } from '@/fields/seo'
import { revalidateGlobal } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'

const euros = { type: 'number', min: 0, admin: { description: t('EUR, IVA no incluido', 'EUR, VAT excluded') } } as const

export const Pricing: GlobalConfig = {
  slug: 'pricing',
  label: t('Precios', 'Pricing'),
  admin: {
    group: adminGroups.content,
    preview: (_, { locale }) => previewUrl(buildPath('/pricing', (locale as Locale) ?? 'es')),
  },
  hooks: { afterChange: [revalidateGlobal('global:pricing')] },
  versions: { drafts: true },
  access: { read: publishedOrTeam, readVersions: isTeam, update: isTeam },
  fields: [
    { name: 'eyebrow', type: 'text', label: t('Antetítulo', 'Eyebrow'), localized: true, required: true },
    { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true, required: true },
    { name: 'subtitle', type: 'text', label: t('Subtítulo', 'Subtitle'), localized: true },
    { name: 'intro', type: 'textarea', label: t('Introducción', 'Intro'), localized: true },
    {
      name: 'packages',
      type: 'array',
      label: t('Paquetes', 'Packages'),
      labels: { singular: t('Paquete', 'Package'), plural: t('Paquetes', 'Packages') },
      minRows: 1,
      maxRows: 6,
      admin: { initCollapsed: true },
      validate: (rows: unknown) => {
        const slugs = (Array.isArray(rows) ? rows : []).map((r) => (r as { slug?: string }).slug)
        return new Set(slugs).size === slugs.length || 'Each package needs a unique slug'
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'slug',
              type: 'text',
              label: t('Slug', 'Slug'),
              required: true,
              maxLength: 40,
              admin: {
                description: t(
                  'Identificador estable usado en los enlaces de contacto (?plan=). Minúsculas, dígitos y guiones. No lo traduzcas.',
                  'Stable id used in contact links (?plan=). Lowercase, digits and dashes. Do not translate.',
                ),
              },
              validate: (v: unknown) => (typeof v === 'string' && PLAN_SLUG.test(v)) || 'Use lowercase letters, digits and dashes',
            },
            { name: 'name', type: 'text', label: t('Nombre', 'Name'), localized: true, required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'initialPrice', label: t('Precio inicial', 'Initial price'), ...euros, required: true },
            { name: 'monthlyPrice', label: t('Precio mensual', 'Monthly price'), ...euros },
            {
              name: 'featured',
              type: 'checkbox',
              label: t('Destacado', 'Featured'),
              defaultValue: false,
              admin: { description: t('Se resalta como recomendado', 'Highlighted as recommended') },
            },
          ],
        },
        {
          name: 'items',
          type: 'array',
          label: t('Inclusiones', 'Inclusions'),
          localized: true,
          labels: { singular: t('Inclusión', 'Inclusion'), plural: t('Inclusiones', 'Inclusions') },
          fields: [
            { name: 'text', type: 'text', label: t('Texto', 'Text'), required: true },
            {
              name: 'excluded',
              type: 'checkbox',
              label: t('Excluido', 'Excluded'),
              defaultValue: false,
              admin: { description: t('Se muestra como no incluido (p. ej. «Sin SEO»)', 'Shown as not included (e.g. "Sin SEO")') },
            },
          ],
        },
        { name: 'ctaLabel', type: 'text', label: t('Texto del botón', 'Button label'), localized: true },
      ],
    },
    {
      name: 'custom',
      type: 'group',
      label: t('A medida', 'Custom'),
      admin: { description: t('Tarjeta de servicio a medida (precio «desde»)', 'Custom service card ("from" price)') },
      fields: [
        { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true, required: true },
        { name: 'subtitle', type: 'text', label: t('Subtítulo', 'Subtitle'), localized: true },
        { name: 'description', type: 'textarea', label: t('Descripción', 'Description'), localized: true },
        {
          type: 'row',
          fields: [
            { name: 'fromPrice', label: t('Precio desde', 'From price'), ...euros },
            { name: 'monthlyPrice', label: t('Precio mensual', 'Monthly price'), ...euros },
          ],
        },
        { name: 'ctaLabel', type: 'text', label: t('Texto del botón', 'Button label'), localized: true },
      ],
    },
    {
      name: 'vatNote',
      type: 'text',
      label: t('Nota de IVA', 'VAT note'),
      localized: true,
      admin: { description: t('Se muestra tras cada precio, p. ej. «+ IVA»', 'Shown after every price, e.g. "+ IVA"') },
    },
    { name: 'footnote', type: 'textarea', label: t('Nota al pie', 'Footnote'), localized: true },
    seoField(),
  ],
}
