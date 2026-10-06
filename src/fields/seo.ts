import type { Field } from 'payload'

export function seoField(): Field {
  return {
    name: 'seo',
    type: 'group',
    admin: { description: 'Search engine and social preview. Leave empty to use defaults.' },
    fields: [
      { name: 'title', type: 'text', localized: true, maxLength: 60 },
      { name: 'description', type: 'textarea', localized: true, maxLength: 160 },
      { name: 'image', type: 'upload', relationTo: 'media' },
    ],
  }
}
