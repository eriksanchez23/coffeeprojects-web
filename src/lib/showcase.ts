import type { Shot } from '@/components/showcase/device-frames'
import type { Media, Project } from '@/payload-types'
import { projectPublicUrl } from './project-view'

export type ShowcaseSlide = { slug: string; title: string; url: string; desktop: Shot; mobile?: Shot }

const asShot = (m: unknown): Shot | null => {
  const media = m && typeof m === 'object' ? (m as Media) : null
  if (!media?.url || !media.width || !media.height) return null
  return { src: media.url, alt: media.alt, width: media.width, height: media.height }
}

/**
 * Real screenshots for the home hero: projects with a desktop cover (and, when the first gallery image is a portrait
 * phone capture, that view too). Client work comes first and our own website last; NDA projects never appear.
 * No project with a cover → no slides, and the hero shows its neutral sketch.
 */
export function pickShowcase(projects: Project[], limit = 3): ShowcaseSlide[] {
  const slides: (ShowcaseSlide & { own: boolean })[] = []
  for (const p of projects) {
    if (p.nda || p.kind === 'app') continue
    const desktop = asShot(p.cover)
    if (!desktop) continue
    const phone = asShot((p.gallery ?? [])[0])
    const url = projectPublicUrl(p)
    slides.push({
      slug: p.slug,
      title: p.title,
      url: url ? new URL(url).hostname : p.title,
      desktop,
      mobile: phone && phone.height > phone.width ? phone : undefined,
      own: Boolean(url && /(^|\.)coffeeprojects\.es$/.test(new URL(url).hostname)),
    })
  }
  return slides
    .sort((a, b) => Number(a.own) - Number(b.own))
    .slice(0, limit)
    .map(({ own: _own, ...s }) => s)
}
