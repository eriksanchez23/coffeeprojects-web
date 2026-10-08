import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isTeam, nobody } from '@/access'
import { budgets, contactStatuses, projectTypes, timelines } from '@/features/contact/options'
import {
  adminGroups,
  bilingualOptions,
  budgetLabels,
  contactStatusLabels,
  localeLabels,
  projectTypeLabels,
  t,
  timelineLabels,
} from '@/fields/labels'

const readOnly = { readOnly: true }
const locked = { update: () => false }

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: { singular: t('Solicitud de contacto', 'Contact request'), plural: t('Solicitudes de contacto', 'Contact requests') },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'projectType', 'plan', 'status', 'createdAt'],
    listSearchableFields: ['name', 'email', 'message'],
    group: adminGroups.inbox,
    components: { beforeListTable: ['/components/admin/default-new-filter#DefaultNewFilter'] },
  },
  defaultSort: '-createdAt',
  access: {
    // Public submissions go through the Server Action with the Local API (T11), never through REST.
    create: nobody,
    read: isTeam,
    update: isTeam,
    delete: isAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          label: t('Estado', 'Status'),
          required: true,
          defaultValue: 'new',
          options: bilingualOptions(contactStatuses, contactStatusLabels),
          admin: { components: { Cell: '/components/admin/status-cell#StatusCell' } },
        },
        { name: 'assignedTo', type: 'relationship', relationTo: 'users', label: t('Asignada a', 'Assigned to') },
      ],
    },
    { name: 'internalNotes', type: 'textarea', label: t('Notas internas', 'Internal notes') },
    { name: 'name', type: 'text', label: t('Nombre', 'Name'), required: true, admin: readOnly, access: locked },
    { name: 'email', type: 'email', label: t('Correo electrónico', 'Email'), required: true, admin: readOnly, access: locked },
    { name: 'phone', type: 'text', label: t('Teléfono', 'Phone'), admin: readOnly, access: locked },
    {
      name: 'projectType',
      type: 'select',
      label: t('Tipo de proyecto', 'Project type'),
      required: true,
      options: bilingualOptions(projectTypes, projectTypeLabels),
      admin: readOnly,
      access: locked,
    },
    {
      name: 'plan',
      type: 'text',
      label: t('Plan', 'Plan'),
      admin: {
        ...readOnly,
        description: t(
          'Plan de web elegido en la página de precios (validado con el global de Precios)',
          'Web plan chosen on the pricing page (validated against the Pricing global)',
        ),
      },
      access: locked,
    },
    {
      name: 'budget',
      type: 'select',
      label: t('Presupuesto', 'Budget'),
      options: bilingualOptions(budgets, budgetLabels),
      admin: readOnly,
      access: locked,
    },
    {
      name: 'timeline',
      type: 'select',
      label: t('Plazo', 'Timeline'),
      options: bilingualOptions(timelines, timelineLabels),
      admin: readOnly,
      access: locked,
    },
    { name: 'message', type: 'textarea', label: t('Mensaje', 'Message'), required: true, admin: readOnly, access: locked },
    { name: 'howFound', type: 'text', label: t('Cómo nos ha conocido', 'How they found us'), admin: readOnly, access: locked },
    { name: 'ndaRequested', type: 'checkbox', label: t('NDA solicitado', 'NDA requested'), admin: readOnly, access: locked },
    {
      name: 'privacyAccepted',
      type: 'checkbox',
      label: t('Política de privacidad aceptada', 'Privacy policy accepted'),
      required: true,
      admin: readOnly,
      access: locked,
    },
    {
      name: 'marketingConsent',
      type: 'checkbox',
      label: t('Consentimiento de marketing', 'Marketing consent'),
      admin: readOnly,
      access: locked,
    },
    {
      name: 'locale',
      type: 'select',
      label: t('Idioma', 'Language'),
      options: bilingualOptions(['es', 'en', 'fr'], localeLabels),
      admin: readOnly,
      access: locked,
    },
    { name: 'sourcePath', type: 'text', label: t('Ruta de origen', 'Source path'), admin: readOnly, access: locked },
    {
      type: 'collapsible',
      label: t('Atribución (Meta Ads / UTM)', 'Attribution (Meta Ads / UTM)'),
      fields: [
        { name: 'utmSource', type: 'text', label: t('Origen UTM', 'UTM source'), admin: readOnly, access: locked },
        { name: 'utmMedium', type: 'text', label: t('Medio UTM', 'UTM medium'), admin: readOnly, access: locked },
        { name: 'utmCampaign', type: 'text', label: t('Campaña UTM', 'UTM campaign'), admin: readOnly, access: locked },
        { name: 'utmContent', type: 'text', label: t('Contenido UTM', 'UTM content'), admin: readOnly, access: locked },
        { name: 'utmTerm', type: 'text', label: t('Término UTM', 'UTM term'), admin: readOnly, access: locked },
        { name: 'fbclid', type: 'text', label: t('fbclid', 'fbclid'), admin: readOnly, access: locked },
      ],
    },
    {
      name: 'ipHash',
      type: 'text',
      label: t('Hash de IP', 'IP hash'),
      index: true,
      admin: { hidden: true },
      access: { read: isAdminField, update: () => false },
    },
  ],
}
