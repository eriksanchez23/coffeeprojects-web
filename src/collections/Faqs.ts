import type { CollectionConfig } from 'payload'
import { isTeam } from '@/access'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'order'], group: 'Content' },
  defaultSort: 'order',
  access: { read: () => true, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'question', type: 'text', required: true, localized: true },
    { name: 'answer', type: 'textarea', required: true, localized: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
