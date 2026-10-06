import type { CollectionConfig } from 'payload'
import { isAdmin, isTeam, nobody } from '@/access'
import { budgets, contactStatuses, projectTypes, timelines, toOptions } from '@/features/contact/options'

const readOnly = { readOnly: true }

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: { singular: 'Contact request', plural: 'Contact requests' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'projectType', 'status', 'utmCampaign', 'createdAt'],
    listSearchableFields: ['name', 'email', 'message'],
    group: 'Inbox',
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
        { name: 'status', type: 'select', required: true, defaultValue: 'new', options: toOptions(contactStatuses) },
        { name: 'assignedTo', type: 'relationship', relationTo: 'users' },
      ],
    },
    { name: 'internalNotes', type: 'textarea' },
    { name: 'name', type: 'text', required: true, admin: readOnly },
    { name: 'email', type: 'email', required: true, admin: readOnly },
    { name: 'phone', type: 'text', admin: readOnly },
    { name: 'projectType', type: 'select', required: true, options: toOptions(projectTypes), admin: readOnly },
    { name: 'budget', type: 'select', options: toOptions(budgets), admin: readOnly },
    { name: 'timeline', type: 'select', options: toOptions(timelines), admin: readOnly },
    { name: 'message', type: 'textarea', required: true, admin: readOnly },
    { name: 'howFound', type: 'text', admin: readOnly },
    { name: 'ndaRequested', type: 'checkbox', admin: readOnly },
    { name: 'privacyAccepted', type: 'checkbox', required: true, admin: readOnly },
    { name: 'marketingConsent', type: 'checkbox', admin: readOnly },
    { name: 'locale', type: 'select', options: toOptions(['es', 'en', 'fr']), admin: readOnly },
    { name: 'sourcePath', type: 'text', admin: readOnly },
    {
      type: 'collapsible',
      label: 'Attribution (Meta Ads / UTM)',
      fields: [
        { name: 'utmSource', type: 'text', admin: readOnly },
        { name: 'utmMedium', type: 'text', admin: readOnly },
        { name: 'utmCampaign', type: 'text', admin: readOnly },
        { name: 'utmContent', type: 'text', admin: readOnly },
        { name: 'utmTerm', type: 'text', admin: readOnly },
        { name: 'fbclid', type: 'text', admin: readOnly },
      ],
    },
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true } },
  ],
}
