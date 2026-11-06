import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { SiteSketch } from '@/components/showcase/device-frames'
import { Link } from '@/i18n/navigation'
import { coverGradient } from '@/lib/project-view'
import type { Media, Project } from '@/payload-types'

export async function ProjectCard({ project: p, headingAs: Heading = 'h3' }: { project: Project; headingAs?: 'h2' | 'h3' }) {
  const [t, tp] = await Promise.all([getTranslations('common'), getTranslations('projects')])
  const cover = typeof p.cover === 'object' ? (p.cover as Media | null) : null
  return (
    <Link href={{ pathname: '/projects/[slug]', params: { slug: p.slug } }} className="group block h-full" data-reveal>
      <article className="card-lift flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-line" style={cover?.url ? undefined : { background: coverGradient(p.slug) }}>
          {cover?.url ? (
            <Image src={cover.url} alt={cover.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
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
          <Heading className="mt-3 text-xl font-semibold">{p.title}</Heading>
          <p className="mt-2 text-ink-2">{p.summary}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs">
            {p.concept && <Badge>{tp('concept')}</Badge>}
            {p.nda && <Badge>{t('nda')}</Badge>}
            {p.status === 'in-progress' && <Badge>{t('inProgress')}</Badge>}
            <span className="ml-auto text-ink-3">{p.year}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
