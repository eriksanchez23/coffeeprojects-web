import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { getProjects } from '@/lib/cms/queries'
import { ProjectCard } from './project-card'

type Props = { locale: Locale; title: string; lead?: string | null; as?: 'h1' | 'h2'; featuredOnly?: boolean; limit?: number; kinds?: string[]; hideMore?: boolean }

export async function ProjectsPreview({ locale, title, lead, as = 'h2', featuredOnly = true, limit, kinds, hideMore = false }: Props) {
  const [all, ts, tc] = await Promise.all([getProjects(locale, { featuredOnly }), getTranslations('sections'), getTranslations('common')])
  // Delivered work first, design proposals after (stable: keeps the CMS order within each group).
  const projects = all
    .filter((p) => !kinds || kinds.includes(p.kind ?? 'other'))
    .sort((a, b) => Number(Boolean(a.concept)) - Number(Boolean(b.concept)))
    .slice(0, limit)
  if (projects.length === 0) return null
  const list = (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-group>
      {projects.map((p) => (
        <li key={p.id}>
          <ProjectCard project={p} headingAs={as === 'h1' ? 'h2' : 'h3'} />
        </li>
      ))}
    </ul>
  )

  if (as === 'h1') {
    return (
      <section id="projects" className="hero-wash pt-20 pb-12" aria-labelledby="projects-title">
        <Container>
          <header className="mb-14 max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-amber">{ts('projects')}</p>
            <h1 id="projects-title" data-split className="text-4xl font-semibold sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {lead && <p className="mt-6 text-lg text-ink-2">{lead}</p>}
          </header>
          {list}
        </Container>
      </section>
    )
  }

  return (
    <Section id="projects" eyebrow={ts('projects')} title={title} lead={lead}>
      {list}
      {!hideMore && (
        <div className="mt-10">
          <Button href="/projects" variant="outline">{tc('viewProjects')} →</Button>
        </div>
      )}
    </Section>
  )
}
