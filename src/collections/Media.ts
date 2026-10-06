import type { CollectionConfig } from 'payload'
import { isTeam } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: { read: () => true, create: isTeam, update: isTeam, delete: isTeam },
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'card', width: 800 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
  fields: [{ name: 'alt', type: 'text', required: true, localized: true }],
}
