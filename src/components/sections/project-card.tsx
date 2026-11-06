import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { SiteSketch } from '@/components/showcase/device-frames'
import { Link } from '@/i18n/navigation'
import { coverGradient, projectPublicUrl } from '@/lib/project-view'
import type { Media, Project } from '@/payload-types'

/**
 * A project card: cover, type, title, summary, the technologies and, when the site is public, a direct link to it.
 * The whole card opens the project page (the title link is stretched over it); the "visit" link sits above that
 * layer, so the two never nest.
 */
export async function ProjectCard({
  project: p,
  headingAs: Heading = 'h3',
  imageSizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
}: {
  project: Project
  headingAs?: 'h2' | 'h3'
  imageSizes?: string
}) {
  const [t, tp] = await Promise.all([getTranslations('common'), getTranslations('projects')])
  const cover = typeof p.cover === 'object' ? (p.cover as Media | null) : null
  // The 800 px "card" rendition is plenty for a card and much lighter to optimize than the full capture.
  const src = cover?.sizes?.card?.url || cover?.url
  const url = projectPublicUrl(p)
  const stack = p.stack ?? []
  return (
    <article
      className="card-lift group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1 has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand"
      data-testid="project-card"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line" style={src ? undefined : { background: coverGradient(p.slug) }}>
        {src && cover ? (
          <Image
            src={src}
            alt={cover.alt}
            fill
            draggable={false}
            sizes={imageSizes}
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-6 overflow-hidden rounded-[var(--radius-md)] border border-line shadow-[var(--shadow-soft)]">
            <SiteSketch />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber">
          {[p.sector, tp(`kinds.${p.kind ?? 'other'}`)].filter(Boolean).join(' · ')}
        </p>
        <Heading className="mt-3 text-xl font-semibold">
          <Link
            href={{ pathname: '/projects/[slug]', params: { slug: p.slug } }}
            draggable={false}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {p.title}
          </Link>
        </Heading>
        <p className="mt-2 text-ink-2">{p.summary}</p>
        {stack.length > 0 && (
          <ul aria-label={tp('technologies')} className="mt-4 flex flex-wrap gap-1.5">
            {stack.map((s) => (
              <li key={s} className="rounded-full bg-bg-2 px-2.5 py-1 font-mono text-[11px] text-ink-1">
                {s}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs">
          {p.concept && <Badge>{tp('concept')}</Badge>}
          {p.nda && <Badge>{t('nda')}</Badge>}
          {p.status === 'in-progress' && <Badge>{t('inProgress')}</Badge>}
          <span className="text-ink-3">{p.year}</span>
          <span className="ml-auto flex items-center gap-3">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                className="relative z-10 font-semibold text-brand underline-offset-4 hover:underline"
                data-testid="project-visit"
              >
                {tp('visitSite')} ↗
              </a>
            )}
            <span aria-hidden className="font-semibold text-ink-1 transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </div>
    </article>
  )
}
