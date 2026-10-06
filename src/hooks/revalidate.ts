import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

type Logger = { debug: (msg: string) => void; warn: (msg: string) => void }

function safeRevalidate(tag: string, log: Logger) {
  try {
    // expire: 0 = immediate expiry, so the first reload after publishing shows the change.
    revalidateTag(tag, { expire: 0 })
  } catch (err) {
    // Outside a Next.js request (e.g. `pnpm seed`) there is no cache to revalidate.
    if (err instanceof Error && /static generation store/i.test(err.message)) {
      log.debug(`skip revalidate ${tag} (no Next.js context)`)
    } else {
      log.warn(`revalidate ${tag} failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

const isDraft = (doc: unknown) => (doc as { _status?: string } | null)?._status === 'draft'

/** Live content changed: a publish/save of a published doc, or an unpublish (published → draft). */
const wasPublished = (doc: unknown) => (doc as { _status?: string } | null)?._status === 'published'
const affectsLiveContent = (doc: unknown, previousDoc: unknown) => !isDraft(doc) || wasPublished(previousDoc)

export const revalidateCollection =
  (tag: string): CollectionAfterChangeHook =>
  ({ doc, previousDoc, req }) => {
    if (affectsLiveContent(doc, previousDoc)) safeRevalidate(tag, req.payload.logger)
    return doc
  }

export const revalidateCollectionDelete =
  (tag: string): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    safeRevalidate(tag, req.payload.logger)
    return doc
  }

export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, previousDoc, req }) => {
    if (affectsLiveContent(doc, previousDoc)) safeRevalidate(tag, req.payload.logger)
    return doc
  }

/** Cache tags whose reads embed media documents (every CMS read uses depth 1). */
export const MEDIA_DEPENDENT_TAGS = [
  'services',
  'projects',
  'team-members',
  'global:home',
  'global:pricing',
  'global:site-settings',
  'global:legal',
]

/** A replaced/edited image (alt text, focal point) or a deleted one must not linger in cached pages. */
export const revalidateMedia: CollectionAfterChangeHook = ({ doc, req }) => {
  for (const tag of MEDIA_DEPENDENT_TAGS) safeRevalidate(tag, req.payload.logger)
  return doc
}

export const revalidateMediaDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  for (const tag of MEDIA_DEPENDENT_TAGS) safeRevalidate(tag, req.payload.logger)
  return doc
}
