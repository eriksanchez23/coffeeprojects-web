import { detectStack } from './detect-stack'
import { type SafeFetchErrorCode, type SafeFetchOptions, type SafeResponse, safeFetch } from './fetch-safe'
import { parsePageMeta } from './parse'
import { type CurrentValues, type FillPlan, planFill, wantsImage } from './plan'

/**
 * S23: "Import from website" for a project. Fetches the public page (SSRF-safe), reads its metadata and stack,
 * gets a cover (Microlink screenshot, falling back to og:image / twitter:image), stores it in Media through
 * `createMedia`, and returns which form fields to fill. Nothing here touches the project itself: the admin
 * form receives the values and the user reviews them before saving.
 */

export type ImportErrorCode = SafeFetchErrorCode | 'notHtml'
export class ImportError extends Error {
  constructor(readonly code: ImportErrorCode) {
    super(`project import: ${code}`)
    this.name = 'ImportError'
  }
}

export type FetchLike = (url: string, init: Pick<SafeFetchOptions, 'timeoutMs' | 'maxBytes' | 'headers'>) => Promise<SafeResponse>
export interface ImageFile {
  data: Buffer
  mimetype: string
  name: string
}
export interface ImportDeps {
  fetch?: FetchLike
  /** Creates the Media doc (alt per locale) and returns its id. */
  createMedia: (file: ImageFile, alt: { es: string; en: string; fr: string }) => Promise<number | string>
  microlinkKey?: string
}
export interface ImportResult extends FillPlan {
  coverSource?: 'screenshot' | 'ogImage'
  warnings: 'coverFailed'[]
}

const PAGE_LIMITS = { timeoutMs: 10_000, maxBytes: 2 * 1024 * 1024 }
const MICROLINK_LIMITS = { timeoutMs: 20_000, maxBytes: 256 * 1024 }
const IMAGE_LIMITS = { timeoutMs: 10_000, maxBytes: 8 * 1024 * 1024 }

/** Raster types Media accepts, recognised by their magic bytes (a declared content type alone is not trusted; no SVG). */
const IMAGE_TYPES: Record<string, { ext: string; sniff: (b: Buffer) => boolean }> = {
  'image/png': { ext: 'png', sniff: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/jpeg': { ext: 'jpg', sniff: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/webp': { ext: 'webp', sniff: (b) => b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP' },
  'image/avif': { ext: 'avif', sniff: (b) => b.toString('latin1', 4, 8) === 'ftyp' && /^avi[fs]/.test(b.toString('latin1', 8, 12)) },
}

const mediaType = (res: SafeResponse) => (res.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()

export type ShotView = 'desktop' | 'mobile'
const VIEWPORTS: Record<ShotView, Record<string, string>> = {
  desktop: { 'viewport.width': '1440', 'viewport.height': '900' },
  // A phone at 2x: the screenshot shown inside the phone frame (project pages, home hero).
  mobile: {
    'viewport.width': '390',
    'viewport.height': '844',
    'viewport.deviceScaleFactor': '2',
    'viewport.isMobile': 'true',
    'viewport.hasTouch': 'true',
    waitForTimeout: '2500',
  },
}

/** Only the public page URL goes to Microlink; with a key, the pro endpoint (the key travels as a header). */
export function microlinkUrl(target: string, pro: boolean, view: ShotView = 'desktop'): string {
  const params = new URLSearchParams({
    url: target,
    screenshot: 'true',
    meta: 'false',
    ...VIEWPORTS[view],
    'screenshot.type': 'jpeg',
  })
  return `https://${pro ? 'pro' : 'api'}.microlink.io/?${params}`
}

async function downloadImage(fetch: FetchLike, url: string): Promise<{ data: Buffer; mimetype: string; ext: string }> {
  const res = await fetch(url, { ...IMAGE_LIMITS, headers: { accept: 'image/avif,image/webp,image/png,image/jpeg' } })
  const mimetype = mediaType(res)
  const type = IMAGE_TYPES[mimetype]
  if (!type || !type.sniff(res.body)) throw new Error('unsupported image')
  return { data: res.body, mimetype, ext: type.ext }
}

async function screenshotUrl(fetch: FetchLike, target: string, key?: string, view: ShotView = 'desktop'): Promise<string> {
  const res = await fetch(microlinkUrl(target, Boolean(key), view), { ...MICROLINK_LIMITS, headers: key ? { 'x-api-key': key } : {} })
  const json = JSON.parse(res.body.toString('utf8')) as { status?: string; data?: { screenshot?: { url?: unknown } } }
  const url = json.data?.screenshot?.url
  if (json.status !== 'success' || typeof url !== 'string') throw new ImportError('network')
  return url
}

/**
 * A screenshot of a public website (desktop or phone viewport) as an image file ready for Media. Used by the seed
 * to give projects with a URL a real cover and phone view; throws when the page cannot be captured.
 */
export async function captureScreenshot(
  target: string,
  view: ShotView,
  deps: { fetch?: FetchLike; microlinkKey?: string } = {},
): Promise<ImageFile> {
  const fetch: FetchLike = deps.fetch ?? safeFetch
  const image = await downloadImage(fetch, await screenshotUrl(fetch, target, deps.microlinkKey, view))
  const slug = new URL(target).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  return { data: image.data, mimetype: image.mimetype, name: `${view === 'mobile' ? 'mobile' : 'cover'}-${slug}.${image.ext}` }
}

export async function importFromWebsite(
  input: { url: string; current: CurrentValues; replaceCover: boolean },
  deps: ImportDeps,
): Promise<ImportResult> {
  const fetch: FetchLike = deps.fetch ?? safeFetch
  const page = await fetch(input.url, { ...PAGE_LIMITS, headers: { accept: 'text/html,application/xhtml+xml' } })
  if (!/^(text\/html|application\/xhtml\+xml)$/.test(mediaType(page))) throw new ImportError('notHtml')

  const html = page.body.toString('utf8')
  const meta = parsePageMeta(html, page.url)
  const stack = detectStack({ html, headers: page.headers, generator: meta.generator })

  const warnings: ImportResult['warnings'] = []
  let imageId: number | string | undefined
  let coverSource: ImportResult['coverSource']
  if (wantsImage(input.current, input.replaceCover)) {
    const site = meta.title ?? page.url.hostname
    const sources: { kind: NonNullable<ImportResult['coverSource']>; locate: () => Promise<string> }[] = [
      { kind: 'screenshot', locate: () => screenshotUrl(fetch, page.url.href, deps.microlinkKey) },
    ]
    if (meta.image) sources.push({ kind: 'ogImage', locate: async () => meta.image! })
    for (const { kind, locate } of sources) {
      try {
        const image = await downloadImage(fetch, await locate())
        const slug = page.url.hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
        imageId = await deps.createMedia(
          { data: image.data, mimetype: image.mimetype, name: `cover-${slug}.${image.ext}` },
          { es: `Portada de ${site}`, en: `Cover of ${site}`, fr: `Couverture de ${site}` },
        )
        coverSource = kind
        break
      } catch {
        // Try the next source; the caller reports a cover that could not be imported.
      }
    }
    if (imageId === undefined) warnings.push('coverFailed')
  }

  const plan = planFill(input.current, { title: meta.title, description: meta.description, stack, year: new Date().getFullYear(), imageId }, input)
  return { ...plan, coverSource, warnings }
}
