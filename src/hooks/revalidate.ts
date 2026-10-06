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

export const revalidateCollection =
  (tag: string): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    if (!isDraft(doc)) safeRevalidate(tag, req.payload.logger)
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
  ({ doc, req }) => {
    if (!isDraft(doc)) safeRevalidate(tag, req.payload.logger)
    return doc
  }
