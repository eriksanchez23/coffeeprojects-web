import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

function safeRevalidate(tag: string, log: (msg: string) => void) {
  try {
    revalidateTag(tag, 'max')
  } catch {
    // Outside a Next.js request (e.g. `pnpm seed`) there is no cache to revalidate.
    log(`skip revalidate ${tag} (no Next.js context)`)
  }
}

export const revalidateCollection =
  (tag: string): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    safeRevalidate(tag, (m) => req.payload.logger.debug(m))
    return doc
  }

export const revalidateCollectionDelete =
  (tag: string): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    safeRevalidate(tag, (m) => req.payload.logger.debug(m))
    return doc
  }

export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req }) => {
    safeRevalidate(tag, (m) => req.payload.logger.debug(m))
    return doc
  }
