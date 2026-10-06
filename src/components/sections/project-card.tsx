import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { coverGradient } from '@/lib/project-view'
import type { Media, Project } from '@/payload-types'

export async function ProjectCard({ project: p, headingAs: Heading = 'h3' }: { project: Project; headingAs?: 'h2' | 'h3' }) {
  const t = await getTranslations('common')
  const cover = typeof p.cover === 'object' ? (p.cover as Media | null) : null
  return (
    <Link href={{ pathname: '/projects/[slug]', params: { slug: p.slug } }} className="group block" data-reveal>
      <article className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1 transition-colors hover:border-line-amber">
        <div className="relative aspect-[16/10]" style={cover?.url ? undefined : { background: coverGradient(p.slug) }}>
          {cover?.url ? (
            <Image src={cover.url} alt={cover.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <span aria-hidden className="absolute inset-0 grid place-items-center font-mono text-sm text-ink-1/70">{`<${p.slug} />`}</span>
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge>{p.category}</Badge>
            <Badge className={p.status === 'live' ? 'text-mint' : 'text-amber'}>{p.status === 'live' ? t('live') : t('inProgress')}</Badge>
            {p.nda && <Badge>{t('nda')}</Badge>}
            <span className="ml-auto font-mono text-ink-3">{p.year}</span>
          </div>
          <Heading className="mt-4 text-2xl font-semibold">{p.title}</Heading>
          <p className="mt-2 text-ink-2">{p.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(p.stack ?? []).map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </div>
      </article>
    </Link>
  )
}
