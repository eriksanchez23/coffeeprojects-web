import type { GlobalConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { PLAN_SLUG } from '@/features/contact/plan'
import { seoField } from '@/fields/seo'
import { revalidateGlobal } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'

const euros = { type: 'number', min: 0, admin: { description: 'EUR, VAT excluded' } } as const

export const Pricing: GlobalConfig = {
  slug: 'pricing',
  label: 'Pricing',
  admin: {
    group: 'Content',
    preview: (_, { locale }) => previewUrl(buildPath('/pricing', (locale as Locale) ?? 'es')),
  },
  hooks: { afterChange: [revalidateGlobal('global:pricing')] },
  versions: { drafts: true },
  access: { read: publishedOrTeam, readVersions: isTeam, update: isTeam },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true, required: true },
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'packages',
      type: 'array',
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
              required: true,
              maxLength: 40,
              admin: { description: 'Stable id used in contact links (?plan=). Lowercase, digits and dashes. Do not translate.' },
              validate: (v: unknown) => (typeof v === 'string' && PLAN_SLUG.test(v)) || 'Use lowercase letters, digits and dashes',
            },
            { name: 'name', type: 'text', localized: true, required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'initialPrice', ...euros, required: true },
            { name: 'monthlyPrice', ...euros },
            { name: 'featured', type: 'checkbox', defaultValue: false, admin: { description: 'Highlighted as recommended' } },
          ],
        },
        {
          name: 'items',
          type: 'array',
          localized: true,
          labels: { singular: 'Inclusion', plural: 'Inclusions' },
          fields: [
            { name: 'text', type: 'text', required: true },
            { name: 'excluded', type: 'checkbox', defaultValue: false, admin: { description: 'Shown as not included (e.g. "Sin SEO")' } },
          ],
        },
        { name: 'ctaLabel', type: 'text', localized: true },
      ],
    },
    {
      name: 'custom',
      type: 'group',
      admin: { description: 'Custom service card ("from" price)' },
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'subtitle', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
        {
          type: 'row',
          fields: [
            { name: 'fromPrice', ...euros },
            { name: 'monthlyPrice', ...euros },
          ],
        },
        { name: 'ctaLabel', type: 'text', localized: true },
      ],
    },
    { name: 'vatNote', type: 'text', localized: true, admin: { description: 'Shown after every price, e.g. "+ IVA"' } },
    { name: 'footnote', type: 'textarea', localized: true },
    seoField(),
  ],
}
