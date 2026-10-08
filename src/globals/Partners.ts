import type { Field, GlobalConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { adminGroups, t, type Bilingual } from '@/fields/labels'
import { seoField } from '@/fields/seo'
import { revalidateGlobal } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'

// Partner programme, "Gana dinero con nosotros" (S16, docs/sources/comisiones-colaboradores.txt). Plan prices
// come from the Pricing global; this global holds the page texts and the two commission rates.

const placeholders = t(
  'Admite {high} y {low} (porcentajes de comisión) y {min} y {max} (cuánto más barata sale la web con mantenimiento), que se rellenan solos.',
  'Accepts {high} and {low} (commission rates) and {min} and {max} (how much cheaper the web is with maintenance), filled in automatically.',
)

const rate = (name: string, label: Bilingual, defaultValue: number): Field => ({
  name,
  type: 'number',
  label,
  required: true,
  min: 0,
  max: 100,
  defaultValue,
  admin: { description: t('Porcentaje sobre el precio de la web sin IVA', 'Percentage of the VAT-excluded web price') },
})

const text = (name: string, label: Bilingual, required = false): Field => ({ name, type: 'text', label, localized: true, required })
const area = (name: string, label: Bilingual): Field => ({ name, type: 'textarea', label, localized: true })

export const Partners: GlobalConfig = {
  slug: 'partners',
  label: t('Gana dinero con nosotros', 'Partner programme'),
  admin: {
    group: adminGroups.content,
    description: placeholders,
    preview: (_, { locale }) => previewUrl(buildPath('/partners', (locale as Locale) ?? 'es')),
  },
  hooks: { afterChange: [revalidateGlobal('global:partners')] },
  versions: { drafts: true },
  access: { read: publishedOrTeam, readVersions: isTeam, update: isTeam },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: t('Cabecera', 'Header'),
          fields: [
            text('eyebrow', t('Antetítulo', 'Eyebrow'), true),
            text('title', t('Título', 'Title'), true),
            area('intro', t('Introducción', 'Intro')),
            {
              name: 'notice',
              type: 'group',
              label: t('Aviso destacado', 'Highlighted notice'),
              admin: {
                description: t(
                  'Se muestra bien visible bajo la cabecera: sin compra de un paquete no hay comisión.',
                  'Shown prominently under the header: no package bought, no commission.',
                ),
              },
              fields: [text('title', t('Título', 'Title')), area('text', t('Texto', 'Text'))],
            },
          ],
        },
        {
          label: t('Comisiones', 'Commissions'),
          fields: [
            {
              type: 'row',
              fields: [
                rate('rateWithMaintenance', t('Comisión con mantenimiento (%)', 'Commission with maintenance (%)'), 10),
                rate('rateWebOnly', t('Comisión solo la web (%)', 'Web-only commission (%)'), 5),
              ],
            },
            {
              type: 'row',
              fields: [
                text('withMaintenanceTitle', t('Título «con mantenimiento»', '"With maintenance" title')),
                text('withMaintenanceBadge', t('Etiqueta «con mantenimiento»', '"With maintenance" badge')),
              ],
            },
            text('webOnlyTitle', t('Título «solo la web»', '"Web only" title')),
            text('rateNote', t('Nota bajo los porcentajes', 'Line under the rates')),
            text('tableTitle', t('Título de la tabla', 'Table title')),
            area('tableNote', t('Nota de la tabla', 'Table note')),
          ],
        },
        {
          label: t('Qué vendes', 'What you sell'),
          fields: [
            text('sellTitle', t('Título', 'Title')),
            text('webPlansTitle', t('Título de las webs', 'Websites title')),
            text('maintenanceTitle', t('Título del mantenimiento', 'Maintenance title')),
            area('maintenanceText', t('Texto del mantenimiento', 'Maintenance text')),
            area('sellArgument', t('Argumento clave', 'Key argument')),
          ],
        },
        {
          label: t('Cómo funciona', 'How it works'),
          fields: [
            text('stepsTitle', t('Título', 'Title')),
            {
              name: 'steps',
              type: 'array',
              label: t('Pasos', 'Steps'),
              localized: true,
              labels: { singular: t('Paso', 'Step'), plural: t('Pasos', 'Steps') },
              admin: { initCollapsed: true },
              fields: [
                { name: 'title', type: 'text', label: t('Título', 'Title'), required: true },
                { name: 'text', type: 'textarea', label: t('Texto', 'Text'), required: true },
              ],
            },
          ],
        },
        {
          label: t('Condiciones', 'Conditions'),
          fields: [
            text('conditionsTitle', t('Título', 'Title')),
            {
              name: 'conditions',
              type: 'array',
              label: t('Condiciones', 'Conditions'),
              localized: true,
              labels: { singular: t('Condición', 'Condition'), plural: t('Condiciones', 'Conditions') },
              admin: { initCollapsed: true },
              fields: [
                { name: 'topic', type: 'text', label: t('Tema', 'Topic'), required: true },
                { name: 'condition', type: 'textarea', label: t('Condición', 'Condition'), required: true },
              ],
            },
            {
              name: 'dontPromise',
              type: 'group',
              label: t('Lo que no debes prometer', 'What not to promise'),
              fields: [text('title', t('Título', 'Title')), area('text', t('Texto', 'Text'))],
            },
            area('footnote', t('Nota al pie', 'Footnote')),
          ],
        },
        {
          label: t('Registrar cliente', 'Register a client'),
          fields: [
            {
              name: 'cta',
              type: 'group',
              label: t('Llamada a la acción', 'Call to action'),
              admin: {
                description: t(
                  'El botón abre un correo a la dirección de Ajustes del sitio con este asunto y cuerpo. No pongas datos personales.',
                  'The button opens an e-mail to the Site settings address with this subject and body. Never put personal data here.',
                ),
              },
              fields: [
                text('title', t('Título', 'Title')),
                area('text', t('Texto', 'Text')),
                {
                  type: 'row',
                  fields: [text('registerLabel', t('Texto del botón', 'Button label')), text('contactLabel', t('Texto del botón secundario', 'Secondary button label'))],
                },
                text('emailSubject', t('Asunto del correo', 'E-mail subject')),
                area('emailBody', t('Cuerpo del correo', 'E-mail body')),
              ],
            },
          ],
        },
      ],
    },
    seoField(),
  ],
}
