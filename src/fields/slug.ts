import type { Field, FieldHook } from 'payload'
import { t } from '@/fields/labels'

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const fillFrom =
  (source: string): FieldHook =>
  ({ value, siblingData }) => {
    if (typeof value === 'string' && value.length > 0) return slugify(value)
    const fallback = siblingData?.[source]
    return typeof fallback === 'string' ? slugify(fallback) : value
  }

export function slugField(source = 'title'): Field {
  return {
    name: 'slug',
    type: 'text',
    label: t('Slug', 'Slug'),
    localized: true,
    index: true,
    required: true,
    admin: {
      position: 'sidebar',
      description: t(
        'Segmento de la URL. Se genera a partir del título si se deja vacío.',
        'URL segment. Generated from the title if left empty.',
      ),
    },
    hooks: { beforeValidate: [fillFrom(source)] },
  }
}
