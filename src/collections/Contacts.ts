import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isTeam, nobody } from '@/access'
import { contactReplyEndpoint } from '@/endpoints/contact-reply'
import { contactThankYouPdfEndpoint, contactThankYouSendEndpoint } from '@/endpoints/contact-thank-you'
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
  // S19: POST /api/contacts/:id/reply (team only) — used by the "Responder" panel in the edit view.
  // S22: GET /api/contacts/:id/thank-you.pdf + POST /api/contacts/:id/thank-you (team only) — "Agradecimiento (PDF)".
  endpoints: [contactReplyEndpoint, contactThankYouPdfEndpoint, contactThankYouSendEndpoint],
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
    {
      name: 'replyAction',
      type: 'ui',
      label: t('Responder', 'Reply'),
      admin: { position: 'sidebar', components: { Field: '/components/admin/contact-reply#ContactReply' } },
    },
    {
      name: 'thankYouAction',
      type: 'ui',
      label: t('Agradecimiento (PDF)', 'Thank-you note (PDF)'),
      admin: { position: 'sidebar', components: { Field: '/components/admin/contact-thank-you#ContactThankYou' } },
    },
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
      name: 'quotedSummary',
      type: 'textarea',
      label: t('Precio y plazo mostrados', 'Quoted price and time'),
      admin: {
        ...readOnly,
        description: t(
          'Precio final (IVA incluido) y plazo estimado que vio el cliente en el formulario',
          'Final price (VAT included) and estimated time the client saw on the form',
        ),
      },
      access: locked,
    },
    // Retired from the form (S17): kept for requests sent before, shown only when they hold a value.
    {
      name: 'budget',
      type: 'select',
      label: t('Presupuesto', 'Budget'),
      options: bilingualOptions(budgets, budgetLabels),
      admin: { ...readOnly, condition: (data) => Boolean(data?.budget) },
      access: locked,
    },
    {
      name: 'timeline',
      type: 'select',
      label: t('Plazo', 'Timeline'),
      options: bilingualOptions(timelines, timelineLabels),
      admin: { ...readOnly, condition: (data) => Boolean(data?.timeline) },
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
      name: 'replies',
      type: 'array',
      label: t('Respuestas enviadas', 'Sent replies'),
      labels: { singular: t('Respuesta', 'Reply'), plural: t('Respuestas', 'Replies') },
      admin: {
        readOnly: true,
        description: t(
          'Historial de respuestas enviadas desde el panel con «Responder» o respondiendo por email al aviso de la solicitud',
          'Replies sent from the panel with "Reply" or by answering the request notification email',
        ),
      },
      // Written only by the reply endpoints (overrideAccess) after the email was sent (S19 panel, S21 email).
      access: { create: () => false, update: () => false },
      fields: [
        { name: 'sentAt', type: 'date', label: t('Enviada', 'Sent'), required: true, access: locked, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'author', type: 'relationship', relationTo: 'users', label: t('Autor', 'Author'), access: locked },
        { name: 'subject', type: 'text', label: t('Asunto', 'Subject'), required: true, access: locked },
        { name: 'body', type: 'textarea', label: t('Mensaje', 'Message'), required: true, access: locked },
        {
          name: 'channel',
          type: 'select',
          label: t('Canal', 'Channel'),
          defaultValue: 'panel',
          options: [
            { label: t('Panel', 'Panel'), value: 'panel' },
            { label: t('Email', 'Email'), value: 'email' },
          ],
          access: locked,
        },
        // S21: Svix message id of the webhook delivery that stored this reply (dedupes Resend retries).
        { name: 'inboundId', type: 'text', access: locked, admin: { hidden: true } },
      ],
    },
    {
      name: 'thankYouSent',
      type: 'array',
      label: t('Agradecimientos enviados', 'Thank-you notes sent'),
      labels: { singular: t('Envío', 'Send'), plural: t('Envíos', 'Sends') },
      admin: {
        readOnly: true,
        description: t(
          'Cada envío del PDF de agradecimiento al cliente desde «Agradecimiento (PDF)»',
          'Each time the thank-you PDF was emailed to the client from "Thank-you note (PDF)"',
        ),
      },
      // Written only by POST /api/contacts/:id/thank-you (overrideAccess) after the email was sent (S22).
      access: { create: () => false, update: () => false },
      fields: [
        { name: 'sentAt', type: 'date', label: t('Enviado', 'Sent'), required: true, access: locked, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'author', type: 'relationship', relationTo: 'users', label: t('Enviado por', 'Sent by'), access: locked },
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
