import type { GlobalConfig } from 'payload'
import { isTeam } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Settings' },
  access: { read: () => true, update: isTeam },
  fields: [
    { name: 'contactEmail', type: 'email', required: true, defaultValue: 'contact@coffeeprojects.es' },
    { name: 'tagline', type: 'text', localized: true, required: true },
    {
      name: 'chatUrl',
      type: 'text',
      admin: { description: 'Optional "Open chat" link (Discord/WhatsApp). Hidden when empty (spec Q4).' },
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        { name: 'network', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'defaultSeo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
