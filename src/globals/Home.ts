import type { GlobalConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { adminGroups, t } from '@/fields/labels'
import { revalidateGlobal } from '@/hooks/revalidate'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import { previewUrl } from '@/lib/cms/preview-url'

export const Home: GlobalConfig = {
  slug: 'home',
  label: t('Inicio', 'Home'),
  admin: {
    group: adminGroups.content,
    preview: (_, { locale }) => {
      return previewUrl(buildPath('/', (locale as Locale) ?? 'es'))
    },
  },
  hooks: { afterChange: [revalidateGlobal('global:home')] },
  versions: { drafts: true },
  access: { read: publishedOrTeam, readVersions: isTeam, update: isTeam },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: t('Cabecera', 'Hero'),
      fields: [
        { name: 'eyebrow', type: 'text', label: t('Antetítulo', 'Eyebrow'), localized: true, required: true },
        { name: 'headline', type: 'text', label: t('Titular', 'Headline'), localized: true, required: true },
        { name: 'subheadline', type: 'textarea', label: t('Subtitular', 'Subheadline'), localized: true, required: true },
        { name: 'trustLine', type: 'text', label: t('Línea de confianza', 'Trust line'), localized: true, required: true },
      ],
    },
    {
      name: 'paths',
      type: 'group',
      label: t('Dos caminos (web nueva / mejorar mi web)', 'Two paths (new website / improve my website)'),
      fields: [
        { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true },
        { name: 'newTitle', type: 'text', label: t('Web nueva: título', 'New website: title'), localized: true },
        { name: 'newText', type: 'textarea', label: t('Web nueva: texto', 'New website: text'), localized: true },
        {
          name: 'newPoints',
          type: 'array',
          label: t('Web nueva: puntos', 'New website: points'),
          localized: true,
          fields: [{ name: 'text', type: 'text', label: t('Texto', 'Text'), required: true }],
        },
        { name: 'newPrice', type: 'text', label: t('Web nueva: precio y plazo', 'New website: price and time'), localized: true },
        { name: 'redesignTitle', type: 'text', label: t('Mejorar: título', 'Improve: title'), localized: true },
        { name: 'redesignText', type: 'textarea', label: t('Mejorar: texto', 'Improve: text'), localized: true },
        {
          name: 'redesignPoints',
          type: 'array',
          label: t('Mejorar: puntos', 'Improve: points'),
          localized: true,
          fields: [{ name: 'text', type: 'text', label: t('Texto', 'Text'), required: true }],
        },
        { name: 'redesignPrice', type: 'text', label: t('Mejorar: precio', 'Improve: price'), localized: true },
      ],
    },
    {
      name: 'audit',
      type: 'group',
      label: t('Revisión gratuita', 'Free review'),
      fields: [
        { name: 'eyebrow', type: 'text', label: t('Antetítulo', 'Eyebrow'), localized: true },
        { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true },
        { name: 'lead', type: 'textarea', label: t('Entradilla', 'Lead'), localized: true },
        {
          name: 'symptoms',
          type: 'array',
          label: t('Síntomas', 'Symptoms'),
          localized: true,
          fields: [{ name: 'text', type: 'text', label: t('Texto', 'Text'), required: true }],
        },
        { name: 'offerTitle', type: 'text', label: t('Oferta: título', 'Offer: title'), localized: true },
        { name: 'offerText', type: 'textarea', label: t('Oferta: texto', 'Offer: text'), localized: true },
      ],
    },
    {
      name: 'guarantees',
      type: 'array',
      label: t('Garantías (franja de confianza)', 'Guarantees (trust strip)'),
      localized: true,
      maxRows: 6,
      fields: [
        { name: 'title', type: 'text', label: t('Título', 'Title'), required: true },
        { name: 'text', type: 'text', label: t('Texto', 'Text'), required: true },
      ],
    },
    { name: 'sectorsLine', type: 'text', label: t('Línea de sectores', 'Sectors line'), localized: true },
    {
      name: 'stats',
      type: 'array',
      label: t('Cifras (no se muestran en la web actual)', 'Stats (not shown on the current site)'),
      labels: { singular: t('Cifra', 'Stat'), plural: t('Cifras', 'Stats') },
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'number', label: t('Valor', 'Value'), required: true, min: 1 },
        { name: 'prefix', type: 'text', label: t('Prefijo', 'Prefix') },
        { name: 'suffix', type: 'text', label: t('Sufijo', 'Suffix') },
        { name: 'label', type: 'text', label: t('Etiqueta', 'Label'), localized: true, required: true },
      ],
    },
    {
      name: 'whyUs',
      type: 'array',
      label: t('Por qué nosotros', 'Why us'),
      labels: { singular: t('Motivo', 'Reason'), plural: t('Motivos', 'Reasons') },
      localized: true,
      fields: [
        { name: 'title', type: 'text', label: t('Título', 'Title'), required: true },
        { name: 'text', type: 'textarea', label: t('Texto', 'Text'), required: true },
      ],
    },
    {
      name: 'process',
      type: 'array',
      label: t('Proceso', 'Process'),
      labels: { singular: t('Paso', 'Step'), plural: t('Pasos', 'Steps') },
      localized: true,
      fields: [
        { name: 'title', type: 'text', label: t('Título', 'Title'), required: true },
        { name: 'text', type: 'textarea', label: t('Texto', 'Text'), required: true },
      ],
    },
    {
      name: 'sections',
      type: 'group',
      label: t('Secciones', 'Sections'),
      fields: [
        { name: 'servicesTitle', type: 'text', label: t('Título de servicios', 'Services title'), localized: true, required: true },
        { name: 'servicesLead', type: 'textarea', label: t('Entradilla de servicios', 'Services lead'), localized: true },
        { name: 'whyTitle', type: 'text', label: t('Título de por qué nosotros', 'Why us title'), localized: true, required: true },
        { name: 'processTitle', type: 'text', label: t('Título del proceso', 'Process title'), localized: true, required: true },
        { name: 'teamTitle', type: 'text', label: t('Título del equipo', 'Team title'), localized: true, required: true },
        { name: 'teamLead', type: 'textarea', label: t('Entradilla del equipo', 'Team lead'), localized: true },
        { name: 'projectsTitle', type: 'text', label: t('Título de proyectos', 'Projects title'), localized: true, required: true },
        { name: 'projectsLead', type: 'textarea', label: t('Entradilla de proyectos', 'Projects lead'), localized: true },
        { name: 'stackTitle', type: 'text', label: t('Título de tecnologías', 'Stack title'), localized: true, required: true },
      ],
    },
    {
      name: 'stack',
      type: 'text',
      label: t('Tecnologías', 'Stack'),
      hasMany: true,
      admin: { description: t('Ya no se muestra en la portada; se conserva por si se recupera', 'No longer shown on the home page; kept in case it comes back') },
    },
  ],
}
