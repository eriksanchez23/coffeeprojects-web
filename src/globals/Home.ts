import type { GlobalConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'

export const Home: GlobalConfig = {
  slug: 'home',
  admin: { group: 'Content' },
  versions: { drafts: true },
  access: { read: publishedOrTeam, readVersions: isTeam, update: isTeam },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text', localized: true, required: true },
        { name: 'headline', type: 'text', localized: true, required: true },
        { name: 'subheadline', type: 'textarea', localized: true, required: true },
        { name: 'trustLine', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'number', required: true, min: 1 },
        { name: 'prefix', type: 'text' },
        { name: 'suffix', type: 'text' },
        { name: 'label', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'whyUs',
      type: 'array',
      localized: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    {
      name: 'process',
      type: 'array',
      localized: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    {
      name: 'sections',
      type: 'group',
      fields: [
        { name: 'servicesTitle', type: 'text', localized: true, required: true },
        { name: 'servicesLead', type: 'textarea', localized: true },
        { name: 'whyTitle', type: 'text', localized: true, required: true },
        { name: 'processTitle', type: 'text', localized: true, required: true },
        { name: 'teamTitle', type: 'text', localized: true, required: true },
        { name: 'teamLead', type: 'textarea', localized: true },
        { name: 'projectsTitle', type: 'text', localized: true, required: true },
        { name: 'projectsLead', type: 'textarea', localized: true },
        { name: 'stackTitle', type: 'text', localized: true, required: true },
      ],
    },
    { name: 'stack', type: 'text', hasMany: true, admin: { description: 'Technologies shown in the marquee' } },
  ],
}
