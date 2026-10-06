import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { LegalPage } from '@/components/sections/legal-page'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getLegal } from '@/lib/cms/queries'
import { hasPendingMarkers } from '@/lib/legal'
import { buildMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [legal, t] = await Promise.all([getLegal(locale), getTranslations({ locale, namespace: 'footer' })])
  return buildMetadata({
    locale,
    paths: localizedPaths('/cookies'),
    title: t('cookies'),
    description: t('cookiesDescription'),
    // Draft text (company data or decisions still pending) is never indexed.
    noindex: hasPendingMarkers(legal.cookiePolicy),
  })
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [legal, t] = await Promise.all([getLegal(locale), getTranslations('footer')])
  // Not seeded yet: no empty legal page.
  if (!legal.cookiePolicy) notFound()
  return (
    <PageShell locale={locale} alternates={localizedPaths('/cookies')}>
      <LegalPage title={t('cookies')} content={legal.cookiePolicy} />
    </PageShell>
  )
}
