import type { CollectionConfig } from 'payload'
import { isTeam } from '@/access'
import { revalidateMedia, revalidateMediaDelete } from '@/hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: { read: () => true, create: isTeam, update: isTeam, delete: isTeam },
  hooks: { afterChange: [revalidateMedia], afterDelete: [revalidateMediaDelete] },
  upload: {
    // Raster only: SVG can carry scripts and is served from our origin.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
    focalPoint: true,
    imageSizes: [
      { name: 'card', width: 800 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
  fields: [{ name: 'alt', type: 'text', required: true, localized: true }],
}
