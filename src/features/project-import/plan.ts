/**
 * S23 fill rule: which project form fields an import fills. Only empty fields are filled; the cover is replaced
 * only when the user ticked "Replace cover". Paths are the admin form paths (the SEO group uses dot paths).
 */

export const IMPORT_PATHS = ['title', 'summary', 'stack', 'year', 'cover', 'gallery', 'seo.title', 'seo.description', 'seo.image'] as const
export type ImportPath = (typeof IMPORT_PATHS)[number]
export type CurrentValues = Partial<Record<ImportPath, unknown>>

export interface Found {
  title?: string
  description?: string
  stack: string[]
  year: number
  /** The Media doc created for the cover, when an image was imported. */
  imageId?: number | string
  /** The Media doc created for the phone view (portrait screenshot), when the gallery was empty. */
  phoneId?: number | string
}

export interface FillPlan {
  fill: Partial<Record<ImportPath, unknown>>
  /** Already set in the form, so left alone. */
  skipped: ImportPath[]
  /** Empty in the form, but the website did not provide a value. */
  missing: ImportPath[]
}

// Same limits as src/fields/seo.ts.
const SEO_TITLE_MAX = 60
const SEO_DESCRIPTION_MAX = 160

export function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

/** Cuts at a word boundary and adds "…" when `s` is longer than `max`. */
export function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** Whether the import should fetch an image at all (cover or SEO image to fill). */
export const wantsImage = (current: CurrentValues, replaceCover: boolean) =>
  replaceCover || isEmptyValue(current.cover) || isEmptyValue(current['seo.image'])

export function planFill(current: CurrentValues, found: Found, { replaceCover }: { replaceCover: boolean }): FillPlan {
  const candidates: Record<ImportPath, unknown> = {
    title: found.title,
    summary: found.description,
    stack: found.stack.length ? found.stack : undefined,
    year: found.year,
    cover: found.imageId,
    // The phone view opens the gallery: the home hero shows it in its phone frame.
    gallery: found.phoneId === undefined ? undefined : [found.phoneId],
    'seo.title': found.title && truncate(found.title, SEO_TITLE_MAX),
    'seo.description': found.description && truncate(found.description, SEO_DESCRIPTION_MAX),
    'seo.image': found.imageId,
  }
  const plan: FillPlan = { fill: {}, skipped: [], missing: [] }
  for (const path of IMPORT_PATHS) {
    const value = candidates[path]
    const overwrite = path === 'cover' && replaceCover && !isEmptyValue(value)
    if (!overwrite && !isEmptyValue(current[path])) plan.skipped.push(path)
    else if (isEmptyValue(value)) plan.missing.push(path)
    else plan.fill[path] = value
  }
  return plan
}
