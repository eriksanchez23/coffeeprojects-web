import type { CollectionConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { projectTypes, toOptions } from '@/features/contact/options'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'

export const serviceIcons = ['globe', 'shopping-cart', 'code', 'server', 'bot', 'wrench', 'sparkles'] as const

export const Services: CollectionConfig = {
  slug: 'services',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'priceFrom', 'order', '_status'], group: 'Content' },
  versions: { drafts: true },
  defaultSort: 'order',
  access: { read: publishedOrTeam, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField('title'),
    { name: 'promise', type: 'text', required: true, localized: true, admin: { description: 'Landing hero headline' } },
    { name: 'summary', type: 'textarea', required: true, localized: true },
    { name: 'body', type: 'richText', localized: true },
    { name: 'icon', type: 'select', required: true, options: toOptions(serviceIcons) },
    {
      name: 'contactType',
      type: 'select',
      required: true,
      options: toOptions(projectTypes),
      admin: { description: 'Pre-selects this project type in the contact form' },
    },
    {
      name: 'pricing',
      type: 'group',
      fields: [
        {
          name: 'mode',
          type: 'select',
          required: true,
          defaultValue: 'one-off',
          options: [
            { label: 'One-off price from', value: 'one-off' },
            { label: 'Monthly price from', value: 'monthly' },
            { label: 'Custom quote', value: 'custom' },
            { label: 'External store', value: 'store' },
          ],
        },
        { name: 'amount', type: 'number', min: 0, admin: { condition: (_, s) => s?.mode === 'one-off' || s?.mode === 'monthly' } },
        { name: 'storeUrl', type: 'text', admin: { condition: (_, s) => s?.mode === 'store' } },
      ],
    },
    { name: 'typicalTime', type: 'text', required: true, localized: true },
    { name: 'tags', type: 'text', hasMany: true },
    {
      name: 'features',
      type: 'array',
      localized: true,
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'note', type: 'text', localized: true },
    {
      name: 'faq',
      type: 'array',
      localized: true,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    seoField(),
  ],
}
