import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ThanksPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const t = await getTranslations('thanks')
  return (
    <PageShell locale={locale} alternates={localizedPaths('/contact/thanks')} hideMobileCta>
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
