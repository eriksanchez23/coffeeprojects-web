import { getLocale, getTranslations } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'

export default async function NotFound() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations('notFound')
  return (
    // The URL is unknown, so the language switcher points each locale at its home page.
    <PageShell locale={locale} alternates={localizedPaths('/')} hideMobileCta>
      {/* not-found.tsx cannot export metadata; React hoists this <title> into <head>. */}
      <title>{t('title')}</title>
      <section className="hero-wash grid min-h-[70dvh] place-items-center py-24">
        <Container className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber">{t('error')}</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{t('title')}</h1>
          <p className="mt-6 text-lg text-ink-2">{t('body')}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/" size="lg">{t('cta')}</Button>
            <Button href="/services" size="lg" variant="outline">{t('ctaServices')}</Button>
          </div>
        </Container>
      </section>
    </PageShell>
  )
}
