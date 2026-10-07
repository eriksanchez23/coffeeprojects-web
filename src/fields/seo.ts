import type { Field } from 'payload'
import { t } from '@/fields/labels'

export function seoField(): Field {
  return {
    name: 'seo',
    type: 'group',
    label: t('SEO', 'SEO'),
    admin: {
      description: t(
        'Vista previa en buscadores y redes sociales. Déjalo vacío para usar los valores por defecto.',
        'Search engine and social preview. Leave empty to use defaults.',
      ),
    },
    fields: [
      { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true, maxLength: 60 },
      { name: 'description', type: 'textarea', label: t('Descripción', 'Description'), localized: true, maxLength: 160 },
      { name: 'image', type: 'upload', label: t('Imagen', 'Image'), relationTo: 'media' },
    ],
  }
}
