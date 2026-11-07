import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'
import type { Media } from '@/payload-types'
import { captureScreenshot, type ImageFile, type ShotView } from '@/features/project-import/import'
import { projects } from './data/projects'

/**
 * Real screenshots for the seeded projects: a desktop cover and a phone view (first gallery image). Only projects
 * whose cover or gallery is still empty are touched, so images chosen in the panel are never replaced.
 *
 * Source per image: a file in src/seed/assets/projects/<es-slug>-<desktop|mobile>.webp when it exists (our own
 * site, captured from the build), otherwise a screenshot of the project's public URL taken with the same Microlink
 * service as the panel's "Import from website". Set SEED_SCREENSHOTS=0 to skip the network captures (CI, offline).
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.resolve(dirname, 'assets/projects')

async function localAsset(slug: string, view: ShotView): Promise<ImageFile | null> {
  try {
    const data = await readFile(path.join(ASSETS, `${slug}-${view}.webp`))
    return { data, mimetype: 'image/webp', name: `${view === 'mobile' ? 'mobile' : 'cover'}-${slug}.webp` }
  } catch {
    return null
  }
}

async function createMedia(payload: Payload, file: ImageFile, alt: Record<'es' | 'en' | 'fr', string>) {
  const doc = await payload.create({ collection: 'media', locale: 'es', data: { alt: alt.es }, file: { ...file, size: file.data.length } })
  for (const locale of ['en', 'fr'] as const) await payload.update({ collection: 'media', id: doc.id, locale, data: { alt: alt[locale] } })
  return doc.id
}

type Titles = Record<'es' | 'en' | 'fr', string>
const ALT: Record<ShotView, (t: Titles) => Titles> = {
  desktop: (t) => ({ es: `Portada de la web de ${t.es}`, en: `${t.en} website homepage`, fr: `Page d’accueil du site ${t.fr}` }),
  mobile: (t) => ({ es: `Web de ${t.es} en el móvil`, en: `${t.en} website on a phone`, fr: `Site ${t.fr} sur mobile` }),
}

export async function captureProjectScreenshots(payload: Payload) {
  // On Vercel, files only persist in Blob storage: without its token an upload would be lost after the build.
  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    payload.logger.warn('screenshots: skipped, this deployment has no Vercel Blob storage (BLOB_READ_WRITE_TOKEN)')
    return
  }
  const network = process.env.SEED_SCREENSHOTS !== '0'
  const microlinkKey = process.env.MICROLINK_API_KEY || undefined
  for (const p of projects) {
    if (p.shared.nda) continue
    const slug = p.localized.es.slug
    const found = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, locale: 'es', limit: 1, depth: 0, draft: true })
    const doc = found.docs[0]
    if (!doc) continue
    const wants: ShotView[] = []
    if (!doc.cover) wants.push('desktop')
    if ((doc.gallery ?? []).length === 0) wants.push('mobile')
    if (wants.length === 0) continue

    const data: Record<string, unknown> = {}
    for (const view of wants) {
      let file = await localAsset(slug, view)
      if (!file && network && p.shared.url) {
        try {
          file = await captureScreenshot(p.shared.url, view, { microlinkKey })
        } catch {
          payload.logger.warn(`screenshots: could not capture ${view} view of ${slug}`)
        }
      }
      if (!file) continue
      const titles = { es: p.localized.es.title, en: p.localized.en.title, fr: p.localized.fr.title }
      const id = await createMedia(payload, file, ALT[view](titles))
      if (view === 'desktop') data.cover = id
      else data.gallery = [id]
    }
    if (Object.keys(data).length === 0) continue
    await payload.update({ collection: 'projects', id: doc.id, locale: 'es', data: { ...data, _status: 'published' } as never })
    payload.logger.info(`screenshots: ${slug} (${Object.keys(data).join(', ')})`)
  }
  if (network) await addMissingPhoneViews(payload, microlinkKey)
}

/** A gallery whose first image is a portrait phone capture (what the home hero shows in its phone frame). */
export function hasPhoneView(gallery: unknown): boolean {
  const first = Array.isArray(gallery) ? gallery[0] : undefined
  return Boolean(first && typeof first === 'object' && (first as Media).width && (first as Media).height && (first as Media).height! > (first as Media).width!)
}

/**
 * Every published project with a public website but no phone view, including the ones added from the panel (e.g.
 * before the import captured it): a portrait screenshot is put first in its gallery, keeping the images already there.
 */
async function addMissingPhoneViews(payload: Payload, microlinkKey: string | undefined) {
  const { docs } = await payload.find({ collection: 'projects', where: { _status: { equals: 'published' } }, locale: 'es', depth: 1, limit: 200, pagination: false })
  for (const doc of docs) {
    if (doc.nda || doc.kind === 'app' || !doc.url || !doc.cover || hasPhoneView(doc.gallery)) continue
    let file: ImageFile
    try {
      file = (await localAsset(doc.slug, 'mobile')) ?? (await captureScreenshot(doc.url, 'mobile', { microlinkKey }))
    } catch {
      payload.logger.warn(`screenshots: could not capture mobile view of ${doc.slug}`)
      continue
    }
    // Alt text in every language, from the project's own title in each one.
    const titles = { es: doc.title, en: doc.title, fr: doc.title }
    for (const locale of ['en', 'fr'] as const) {
      const localized = await payload.findByID({ collection: 'projects', id: doc.id, locale, depth: 0 })
      titles[locale] = localized.title || doc.title
    }
    const phone = await createMedia(payload, file, ALT.mobile(titles))
    const kept = (doc.gallery ?? []).map((m) => (typeof m === 'object' && m ? m.id : m))
    await payload.update({ collection: 'projects', id: doc.id, locale: 'es', data: { gallery: [phone, ...kept], _status: 'published' } as never })
    payload.logger.info(`screenshots: ${doc.slug} (phone view)`)
  }
}
