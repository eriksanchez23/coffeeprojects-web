import { getLocale, getTranslations } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'

export default async function NotFound() {
  const locale = (await getLocale()) as Locale
  const [t, tn] = await Promise.all([getTranslations('notFound'), getTranslations('nav')])
  return (
    // The URL is unknown, so the language switcher points each locale at its home page.
    <PageShell locale={locale} alternates={localizedPaths('/')} hideMobileCta>
      {/* not-found.tsx cannot export metadata; React hoists this <title> into <head>. */}
      <title>{t('title')}</title>
      <section className="steam-glow grid min-h-[70dvh] place-items-center py-24">
        <Container className="max-w-xl">
          <div className="rounded-[var(--radius-lg)] border border-line bg-bg-1 p-8 font-mono text-sm">
            <p className="text-mint">{t('command')}</p>
            <p className="mt-2 text-berry">{t('error')}</p>
          </div>
          <h1 className="mt-10 text-4xl font-semibold">{t('body')}</h1>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/" size="lg">{t('cta')}</Button>
            <Button href="/contact" size="lg" variant="outline">{tn('contact')}</Button>
          </div>
        </Container>
      </section>
    </PageShell>
  )
}
