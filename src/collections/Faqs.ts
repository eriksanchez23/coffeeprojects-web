import type { CollectionConfig } from 'payload'
import { isTeam } from '@/access'
import { adminGroups, t } from '@/fields/labels'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: t('Pregunta frecuente', 'FAQ'), plural: t('Preguntas frecuentes', 'FAQs') },
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'order'], group: adminGroups.content },
  hooks: {
    afterChange: [revalidateCollection('faqs')],
    afterDelete: [revalidateCollectionDelete('faqs')],
  },
  defaultSort: 'order',
  access: { read: () => true, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'question', type: 'text', label: t('Pregunta', 'Question'), required: true, localized: true },
    { name: 'answer', type: 'textarea', label: t('Respuesta', 'Answer'), required: true, localized: true },
    { name: 'order', type: 'number', label: t('Orden', 'Order'), defaultValue: 0 },
  ],
}
