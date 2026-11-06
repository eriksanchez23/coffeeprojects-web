import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { ProjectsPreview } from '@/components/sections/projects-preview'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome } from '@/lib/cms/queries'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [home, t, tn] = await Promise.all([getHome(locale), getTranslations({ locale, namespace: 'meta' }), getTranslations({ locale, namespace: 'nav' })])
  return buildMetadata({
    locale,
    paths: localizedPaths('/projects'),
    title: home.sections.projectsTitle || tn('projects'),
    description: home.sections.projectsLead || t('defaultDescription'),
  })
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [home, tn, tp] = await Promise.all([getHome(locale), getTranslations('nav'), getTranslations('projects')])
  return (
    <PageShell locale={locale} alternates={localizedPaths('/projects')}>
      <JsonLd
        data={breadcrumbLd([
          { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
          { name: tn('projects'), url: absoluteUrl(localizedPaths('/projects')[locale]) },
        ])}
      />
      <ProjectsPreview
        locale={locale}
        title={home.sections.projectsTitle || tn('projects')}
        lead={tp('indexLead')}
        as="h1"
        featuredOnly={false}
        kinds={['new-website', 'redesign', 'store']}
      />
      <ProjectsPreview locale={locale} title={tp('appsTitle')} lead={tp('appsLead')} featuredOnly={false} kinds={['app', 'other']} hideMore />
      <CtaBand />
    </PageShell>
  )
}
