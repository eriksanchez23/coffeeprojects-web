import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isTeam, nobody } from '@/access'
import { budgets, contactStatuses, projectTypes, timelines, toOptions } from '@/features/contact/options'

const readOnly = { readOnly: true }
const locked = { update: () => false }

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: { singular: 'Contact request', plural: 'Contact requests' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'projectType', 'plan', 'status', 'createdAt'],
    listSearchableFields: ['name', 'email', 'message'],
    group: 'Inbox',
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
          required: true,
          defaultValue: 'new',
          options: toOptions(contactStatuses),
          admin: { components: { Cell: '/components/admin/status-cell#StatusCell' } },
        },
        { name: 'assignedTo', type: 'relationship', relationTo: 'users' },
      ],
    },
    { name: 'internalNotes', type: 'textarea' },
    { name: 'name', type: 'text', required: true, admin: readOnly, access: locked },
    { name: 'email', type: 'email', required: true, admin: readOnly, access: locked },
    { name: 'phone', type: 'text', admin: readOnly, access: locked },
    { name: 'projectType', type: 'select', required: true, options: toOptions(projectTypes), admin: readOnly, access: locked },
    {
      name: 'plan',
      type: 'text',
      admin: { ...readOnly, description: 'Pricing package chosen on the pricing page (validated against the Pricing global)' },
      access: locked,
    },
    { name: 'budget', type: 'select', options: toOptions(budgets), admin: readOnly, access: locked },
    { name: 'timeline', type: 'select', options: toOptions(timelines), admin: readOnly, access: locked },
    { name: 'message', type: 'textarea', required: true, admin: readOnly, access: locked },
    { name: 'howFound', type: 'text', admin: readOnly, access: locked },
    { name: 'ndaRequested', type: 'checkbox', admin: readOnly, access: locked },
    { name: 'privacyAccepted', type: 'checkbox', required: true, admin: readOnly, access: locked },
    { name: 'marketingConsent', type: 'checkbox', admin: readOnly, access: locked },
    { name: 'locale', type: 'select', options: toOptions(['es', 'en', 'fr']), admin: readOnly, access: locked },
    { name: 'sourcePath', type: 'text', admin: readOnly, access: locked },
    {
      type: 'collapsible',
      label: 'Attribution (Meta Ads / UTM)',
      fields: [
        { name: 'utmSource', type: 'text', admin: readOnly, access: locked },
        { name: 'utmMedium', type: 'text', admin: readOnly, access: locked },
        { name: 'utmCampaign', type: 'text', admin: readOnly, access: locked },
        { name: 'utmContent', type: 'text', admin: readOnly, access: locked },
        { name: 'utmTerm', type: 'text', admin: readOnly, access: locked },
        { name: 'fbclid', type: 'text', admin: readOnly, access: locked },
      ],
    },
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true }, access: { read: isAdminField, update: () => false } },
  ],
}
