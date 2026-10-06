import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { TrackLead } from '@/components/tracking/track-lead'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { buildMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'thanks' })
  return buildMetadata({ locale, paths: localizedPaths('/contact/thanks'), title: t('title'), description: t('body'), noindex: true })
}

export default async function ThanksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ e?: string | string[] }>
}) {
  const locale = (await params).locale as Locale
  const { e } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('thanks')
  return (
    <PageShell locale={locale} alternates={localizedPaths('/contact/thanks')} hideMobileCta>
      <TrackLead eventId={typeof e === 'string' ? e : undefined} />
      <section className="steam-glow grid min-h-[70vh] place-items-center py-24 text-center">
        <Container className="max-w-2xl">
          <p aria-hidden className="text-6xl">☕</p>
          <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">{t('title')}</h1>
          <p className="mt-6 text-lg text-ink-2">{t('body')}</p>
          <Button href="/projects" size="lg" className="mt-10">{t('cta')}</Button>
        </Container>
      </section>
    </PageShell>
  )
}
