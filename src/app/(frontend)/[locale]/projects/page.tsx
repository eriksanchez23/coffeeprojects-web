import { setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { ProjectsPreview } from '@/components/sections/projects-preview'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome } from '@/lib/cms/queries'

export const revalidate = 3600

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const home = await getHome(locale)
  return (
    <PageShell locale={locale} alternates={localizedPaths('/projects')}>
      <ProjectsPreview locale={locale} title={home.sections.projectsTitle} lead={home.sections.projectsLead} as="h1" featuredOnly={false} />
      <CtaBand />
    </PageShell>
  )
}
