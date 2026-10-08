import type { Field, GlobalConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { PLAN_SLUG } from '@/features/contact/plan'
import { adminGroups, bilingualOptions, projectTypeLabels, t, type Bilingual } from '@/fields/labels'
import { seoField } from '@/fields/seo'
import { revalidateGlobal } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'
import { duplicateSlug, validateMinPlan } from '@/lib/pricing'

// Pricing v4 (S15, docs/sources/propuesta-tarifas-web-v4.txt): step 1 web plans, step 2 optional maintenance.
const euros = { type: 'number', min: 0, admin: { description: t('EUR, IVA no incluido', 'EUR, VAT excluded') } } as const

/** Contact project types a web plan can pre-select on the contact form. */
export const webPlanContactTypes = ['web', 'ecommerce', 'custom'] as const

const uniqueSlugs = (rows: unknown) => {
  const dup = duplicateSlug(rows)
  return dup ? `Each plan needs a unique slug ("${dup}" is repeated)` : true
}

const slugField = (description: Bilingual): Field => ({
  name: 'slug',
  type: 'text',
  label: t('Slug', 'Slug'),
  required: true,
  maxLength: 40,
  admin: { description },
  validate: (v: unknown) => (typeof v === 'string' && PLAN_SLUG.test(v)) || 'Use lowercase letters, digits and dashes',
})

const featuredField: Field = {
  name: 'featured',
  type: 'checkbox',
  label: t('Destacado', 'Featured'),
  defaultValue: false,
  admin: { description: t('Se resalta con la etiqueta «Recomendado»', 'Highlighted with the "Recommended" badge') },
}

/** ✓ / – list, localized as a whole (each language has its own rows). */
const inclusionsField: Field = {
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
      admin: {
        description: t('Se muestra como no incluido (p. ej. «Sin correo profesional»)', 'Shown as not included (e.g. "No professional email")'),
      },
    },
  ],
}

/** Titled text blocks (payment terms, change rules, permanence rules…), localized as a whole. */
const notesField = (name: string, label: Bilingual, description?: Bilingual): Field => ({
  name,
  type: 'array',
  label,
  localized: true,
  labels: { singular: t('Bloque', 'Block'), plural: t('Bloques', 'Blocks') },
  admin: { initCollapsed: true, ...(description ? { description } : {}) },
  fields: [
    { name: 'title', type: 'text', label: t('Título', 'Title'), required: true },
    { name: 'text', type: 'textarea', label: t('Texto', 'Text'), required: true },
  ],
})

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
    {
      type: 'tabs',
      tabs: [
        {
          label: t('Cabecera', 'Header'),
          fields: [
            { name: 'eyebrow', type: 'text', label: t('Antetítulo', 'Eyebrow'), localized: true, required: true },
            { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true, required: true },
            { name: 'subtitle', type: 'text', label: t('Subtítulo', 'Subtitle'), localized: true },
            { name: 'intro', type: 'textarea', label: t('Introducción', 'Intro'), localized: true },
            {
              name: 'vatNote',
              type: 'text',
              label: t('Nota de IVA', 'VAT note'),
              localized: true,
              admin: { description: t('Se muestra tras cada precio, p. ej. «+ IVA»', 'Shown after every price, e.g. "+ IVA"') },
            },
            { name: 'footnote', type: 'textarea', label: t('Nota al pie', 'Footnote'), localized: true },
          ],
        },
        {
          label: t('1. Planes de web', '1. Web plans'),
          fields: [
            { name: 'webTitle', type: 'text', label: t('Título del paso', 'Step title'), localized: true, required: true },
            { name: 'webIntro', type: 'textarea', label: t('Introducción del paso', 'Step intro'), localized: true },
            {
              name: 'packages',
              type: 'array',
              label: t('Planes de web', 'Web plans'),
              labels: { singular: t('Plan de web', 'Web plan'), plural: t('Planes de web', 'Web plans') },
              minRows: 1,
              maxRows: 9,
              admin: {
                initCollapsed: true,
                description: t('Pago único. El precio grande es el de «con mantenimiento».', 'One-off payment. The big price is the "with maintenance" one.'),
              },
              validate: uniqueSlugs,
              fields: [
                {
                  type: 'row',
                  fields: [
                    slugField(
                      t(
                        'Identificador estable usado en los enlaces de contacto (?plan=). Minúsculas, dígitos y guiones. No lo traduzcas.',
                        'Stable id used in contact links (?plan=). Lowercase, digits and dashes. Do not translate.',
                      ),
                    ),
                    { name: 'name', type: 'text', label: t('Nombre', 'Name'), localized: true, required: true },
                  ],
                },
                { name: 'pitch', type: 'textarea', label: t('Descripción breve', 'Short pitch'), localized: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'priceWithMaintenance', label: t('Precio con mantenimiento', 'Price with maintenance'), ...euros, required: true },
                    { name: 'priceWebOnly', label: t('Precio solo la web', 'Web-only price'), ...euros, required: true },
                    {
                      name: 'fromPrice',
                      type: 'checkbox',
                      label: t('Precio «desde»', '"From" price'),
                      defaultValue: false,
                      admin: { description: t('Ambos precios se muestran como «desde»', 'Both prices are shown as "from"') },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'minPlan',
                      type: 'text',
                      label: t('Plan mínimo de mantenimiento', 'Minimum maintenance plan'),
                      admin: {
                        description: t(
                          'Slug del plan de mantenimiento a partir del cual se aplica el precio reducido (p. ej. «esencial»)',
                          'Slug of the maintenance plan that unlocks the reduced price (e.g. "esencial")',
                        ),
                      },
                      validate: (v: unknown, { data }: { data: unknown }) => validateMinPlan(v, data),
                    },
                    {
                      name: 'contactType',
                      type: 'select',
                      label: t('Tipo de proyecto en contacto', 'Contact project type'),
                      defaultValue: 'web',
                      options: bilingualOptions(webPlanContactTypes, projectTypeLabels),
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    featuredField,
                    {
                      name: 'isNew',
                      type: 'checkbox',
                      label: t('Nuevo', 'New'),
                      defaultValue: false,
                      admin: { description: t('Muestra la etiqueta «Nuevo»', 'Shows the "New" badge') },
                    },
                  ],
                },
                {
                  name: 'itemsLead',
                  type: 'text',
                  label: t('Frase antes de las inclusiones', 'Line before the inclusions'),
                  localized: true,
                  admin: { description: t('Opcional, p. ej. «El precio base incluye exactamente:»', 'Optional, e.g. "The base price includes exactly:"') },
                },
                inclusionsField,
                { name: 'ctaLabel', type: 'text', label: t('Texto del botón', 'Button label'), localized: true },
              ],
            },
            notesField('webNotes', t('Condiciones', 'Terms'), t('Forma de pago, «solo la web», funciones extra…', 'Payment terms, "web only", extra features…')),
          ],
        },
        {
          label: t('2. Mantenimiento', '2. Maintenance'),
          fields: [
            { name: 'maintenanceTitle', type: 'text', label: t('Título del paso', 'Step title'), localized: true, required: true },
            { name: 'maintenanceIntro', type: 'textarea', label: t('Introducción del paso', 'Step intro'), localized: true },
            {
              name: 'maintenancePlans',
              type: 'array',
              label: t('Planes de mantenimiento', 'Maintenance plans'),
              labels: { singular: t('Plan de mantenimiento', 'Maintenance plan'), plural: t('Planes de mantenimiento', 'Maintenance plans') },
              maxRows: 6,
              admin: { initCollapsed: true },
              validate: uniqueSlugs,
              fields: [
                {
                  type: 'row',
                  fields: [
                    slugField(
                      t(
                        'Identificador estable al que apunta el «plan mínimo» de cada web. Minúsculas, dígitos y guiones. No lo traduzcas.',
                        'Stable id referenced by each web plan\'s "minimum plan". Lowercase, digits and dashes. Do not translate.',
                      ),
                    ),
                    { name: 'name', type: 'text', label: t('Nombre', 'Name'), localized: true, required: true },
                  ],
                },
                { name: 'pitch', type: 'textarea', label: t('Descripción breve', 'Short pitch'), localized: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'monthlyPrice', label: t('Cuota mensual', 'Monthly fee'), ...euros, required: true },
                    {
                      name: 'permanenceMonths',
                      type: 'number',
                      label: t('Permanencia (meses)', 'Minimum term (months)'),
                      min: 0,
                      required: true,
                    },
                    featuredField,
                  ],
                },
                inclusionsField,
                { name: 'ctaLabel', type: 'text', label: t('Texto del botón', 'Button label'), localized: true },
              ],
            },
            {
              name: 'customSupport',
              type: 'group',
              label: t('Soporte a medida', 'Tailored support'),
              admin: { description: t('Nota bajo los planes: no es un plan publicado, se presupuesta', 'Note under the plans: not a published plan, quoted on request') },
              fields: [
                { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true },
                { name: 'text', type: 'textarea', label: t('Texto', 'Text'), localized: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'fromPrice', label: t('Cuota desde', 'Monthly fee from'), ...euros },
                    { name: 'permanenceMonths', type: 'number', label: t('Permanencia (meses)', 'Minimum term (months)'), min: 0 },
                  ],
                },
              ],
            },
            notesField('changeNotes', t('Cambios y cupo', 'Changes and allowance'), t('«¿Qué cuenta como un cambio?» y reglas del cupo', '"What counts as a change?" and allowance rules')),
            {
              name: 'comparison',
              type: 'group',
              label: t('Con mantenimiento vs. solo la web', 'With maintenance vs. web only'),
              fields: [
                { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true },
                { name: 'intro', type: 'textarea', label: t('Introducción', 'Intro'), localized: true },
                {
                  name: 'rows',
                  type: 'array',
                  label: t('Filas', 'Rows'),
                  localized: true,
                  labels: { singular: t('Fila', 'Row'), plural: t('Filas', 'Rows') },
                  fields: [
                    { name: 'label', type: 'text', label: t('Concepto', 'Item'), required: true },
                    {
                      type: 'row',
                      fields: [
                        { name: 'withPlan', type: 'text', label: t('Con mantenimiento', 'With maintenance'), required: true },
                        { name: 'webOnly', type: 'text', label: t('Solo la web', 'Web only'), required: true },
                      ],
                    },
                  ],
                },
              ],
            },
            notesField('permanenceRules', t('Reglas de la permanencia', 'Minimum-term rules')),
          ],
        },
        {
          label: t('Servicios extra', 'Extra services'),
          fields: [
            {
              name: 'extras',
              type: 'group',
              label: t('Tarifa de servicios', 'Service rates'),
              fields: [
                { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true },
                { name: 'intro', type: 'textarea', label: t('Introducción', 'Intro'), localized: true },
                {
                  name: 'rows',
                  type: 'array',
                  label: t('Servicios', 'Services'),
                  labels: { singular: t('Servicio', 'Service'), plural: t('Servicios', 'Services') },
                  admin: {
                    initCollapsed: true,
                    description: t(
                      'Cada columna muestra el importe si lo hay; si no, su texto (p. ej. «Incluida», «Presupuesto»).',
                      'Each column shows the amount when set; otherwise its text (e.g. "Included", "Quote").',
                    ),
                  },
                  fields: [
                    { name: 'service', type: 'text', label: t('Servicio', 'Service'), localized: true, required: true },
                    {
                      type: 'row',
                      fields: [
                        { name: 'withPlan', label: t('Con plan (€)', 'With a plan (€)'), ...euros },
                        { name: 'withPlanText', type: 'text', label: t('Con plan (texto)', 'With a plan (text)'), localized: true },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        { name: 'withoutPlan', label: t('Sin plan (€)', 'Without a plan (€)'), ...euros },
                        { name: 'withoutPlanText', type: 'text', label: t('Sin plan (texto)', 'Without a plan (text)'), localized: true },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    seoField(),
  ],
}
