import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { getProjects } from '@/lib/cms/queries'
import { ProjectCard } from './project-card'

type Props = { locale: Locale; title: string; lead?: string | null; as?: 'h1' | 'h2'; featuredOnly?: boolean }

export async function ProjectsPreview({ locale, title, lead, as = 'h2', featuredOnly = true }: Props) {
  const [projects, ts] = await Promise.all([getProjects(locale, { featuredOnly }), getTranslations('sections')])
  const list = (
    <ul className="grid gap-6 md:grid-cols-2" data-reveal-group>
      {projects.map((p) => (
        <li key={p.id}>
          <ProjectCard project={p} headingAs={as === 'h1' ? 'h2' : 'h3'} />
        </li>
      ))}
    </ul>
  )

  if (as === 'h1') {
    return (
      <section id="projects" className="steam-glow pt-20 pb-24" aria-labelledby="projects-title">
        <Container>
          <header className="mb-14 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{ts('projects')}</p>
            <h1 id="projects-title" data-split className="text-5xl font-semibold sm:text-6xl lg:text-7xl">
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
    </Section>
  )
}
