import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import type { Locale } from '@/i18n/locales'
import { getSettings } from '@/lib/cms/queries'
import { AlternatesProvider } from './alternates-context'
import { MobileCtaBar } from './mobile-cta-bar'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

export async function PageShell({
  locale,
  alternates,
  children,
  hideMobileCta = false,
}: {
  locale: Locale
  alternates: Record<Locale, string>
  children: ReactNode
  hideMobileCta?: boolean
}) {
  const [settings, t] = await Promise.all([getSettings(locale), getTranslations('nav')])
  return (
    <AlternatesProvider value={alternates}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-amber focus:px-4 focus:py-2 focus:text-bg-0"
      >
        {t('skip')}
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter email={settings.contactEmail} chatUrl={settings.chatUrl} />
      {!hideMobileCta && <MobileCtaBar label={t('cta')} />}
    </AlternatesProvider>
  )
}
