import type { Endpoint, PayloadRequest } from 'payload'
import { z } from 'zod'
import { isTeam } from '@/access'
import { SafeFetchError } from '@/features/project-import/fetch-safe'
import { type ImageFile, ImportError, type ImportErrorCode, importFromWebsite } from '@/features/project-import/import'
import { IMPORT_PATHS } from '@/features/project-import/plan'

/**
 * S23: POST /api/projects/import-from-url, team users only. Body: `{ url, replaceCover?, current? }`, where
 * `current` holds the form's present values (so only empty fields are proposed). Fetches the public website
 * (SSRF-safe, see features/project-import/fetch-safe.ts), stores the imported cover in Media and answers
 * `{ ok, fill, skipped, missing, warnings, coverSource }`. The project itself is never written here: the admin
 * form receives `fill` and the user saves. Logs carry error codes only, never the fetched HTML.
 */

export type ProjectImportError =
  | 'unauthorized'
  | 'invalid'
  | 'invalidUrl'
  | 'blockedUrl'
  | 'unreachable'
  | 'timeout'
  | 'tooLarge'
  | 'notHtml'

const bodySchema = z.object({
  url: z.string().trim().min(1).max(2048),
  replaceCover: z.boolean().optional().default(false),
  current: z.partialRecord(z.enum(IMPORT_PATHS), z.unknown()).optional().default({}),
})

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status })
const fail = (status: number, error: ProjectImportError) => json(status, { error })

const FAILURES: Record<ImportErrorCode, [number, ProjectImportError]> = {
  invalidUrl: [422, 'invalidUrl'],
  blockedAddress: [422, 'blockedUrl'],
  timeout: [504, 'timeout'],
  tooLarge: [502, 'tooLarge'],
  notHtml: [502, 'notHtml'],
  httpStatus: [502, 'unreachable'],
  tooManyRedirects: [502, 'unreachable'],
  network: [502, 'unreachable'],
}

async function readBody(req: PayloadRequest): Promise<unknown> {
  try {
    return await req.json?.()
  } catch {
    return undefined
  }
}

/** "noore-club.com" → "https://noore-club.com"; anything with a scheme is left for the URL guard to judge. */
const withScheme = (url: string) => (/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`)

export async function projectImportHandler(req: PayloadRequest): Promise<Response> {
  if (!req.user || !(await isTeam({ req }))) return fail(401, 'unauthorized')
  const parsed = bodySchema.safeParse(await readBody(req))
  if (!parsed.success) return fail(400, 'invalid')

  const createMedia = async (file: ImageFile, alt: { es: string; en: string; fr: string }) => {
    const auth = { overrideAccess: false, user: req.user }
    const doc = await req.payload.create({
      collection: 'media',
      locale: 'es',
      data: { alt: alt.es },
      file: { ...file, size: file.data.length },
      ...auth,
    })
    for (const locale of ['en', 'fr'] as const) {
      await req.payload.update({ collection: 'media', id: doc.id, locale, data: { alt: alt[locale] }, ...auth })
    }
    return doc.id
  }

  try {
    const result = await importFromWebsite(
      { url: withScheme(parsed.data.url), current: parsed.data.current, replaceCover: parsed.data.replaceCover },
      { createMedia, microlinkKey: process.env.MICROLINK_API_KEY || undefined },
    )
    if (result.warnings.length) req.payload.logger.warn('project import: no cover could be imported')
    return json(200, { ok: true, ...result })
  } catch (e) {
    const code = e instanceof ImportError || e instanceof SafeFetchError ? e.code : 'network'
    req.payload.logger.warn({ err: { code } }, 'project import: page fetch failed')
    const [status, error] = FAILURES[code]
    return fail(status, error)
  }
}

export const projectImportEndpoint: Endpoint = { path: '/import-from-url', method: 'post', handler: projectImportHandler }
