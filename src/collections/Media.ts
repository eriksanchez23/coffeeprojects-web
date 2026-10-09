import type { CollectionConfig } from 'payload'
import { isTeam } from '@/access'
import { adminGroups, t } from '@/fields/labels'
import { relativizeMediaDoc } from '@/lib/media/relative-urls'
import { revalidateMedia, revalidateMediaDelete } from '@/hooks/revalidate'

// Self-hosted media lives outside the code checkout (MEDIA_DIR, absolute path on the server).
// Unset/blank -> undefined, so Payload falls back to its default: the slug ("media") resolved against cwd.
export function mediaStaticDir(env: Record<string, string | undefined> = process.env): string | undefined {
  return env.MEDIA_DIR?.trim() || undefined
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: t('Archivo multimedia', 'Media file'), plural: t('Multimedia', 'Media') },
  admin: { group: adminGroups.content },
  access: { read: () => true, create: isTeam, update: isTeam, delete: isTeam },
  hooks: {
    afterChange: [revalidateMedia],
    afterDelete: [revalidateMediaDelete],
    // `serverURL` makes Payload's upload URLs absolute; next/image only accepts relative own-origin paths.
    afterRead: [({ doc, req }) => relativizeMediaDoc(doc, req.payload.config.serverURL)],
  },
  upload: {
    staticDir: mediaStaticDir(),
    // Raster only: SVG can carry scripts and is served from our origin.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
    focalPoint: true,
    imageSizes: [
      { name: 'card', width: 800 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
  fields: [{ name: 'alt', type: 'text', label: t('Texto alternativo', 'Alt text'), required: true, localized: true }],
}
