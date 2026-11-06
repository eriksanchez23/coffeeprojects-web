import { getLocale, getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { ServiceIcon } from '@/components/sections/service-icon'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/locales'
import { getServices } from '@/lib/cms/queries'
import { webServices } from '@/lib/services'
import { LanguageSwitcher } from './language-switcher'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'

export async function SiteHeader() {
  const locale = (await getLocale()) as Locale
  const [t, services] = await Promise.all([getTranslations('nav'), getServices(locale)])
  const main = webServices(services)
  const links = [
    { href: '/projects' as const, label: t('projects') },
    { href: '/pricing' as const, label: t('pricing') },
    { href: '/team' as const, label: t('howWeWork') },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg-0/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label={t('mainNav')} className="hidden items-center gap-7 text-sm font-medium md:flex">
          {/* Hover/focus-within dropdown: plain links, so it works without JavaScript and with the keyboard. */}
          <div className="group relative">
            <Link href="/services" className="inline-flex items-center gap-1 py-5 text-ink-1 transition-colors hover:text-ink-0">
              {t('services')}
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Link>
            {main.length > 0 && (
              <div className="invisible absolute left-1/2 top-full w-[26rem] -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <ul className="grid gap-1 rounded-[var(--radius-lg)] border border-line bg-bg-1 p-2 shadow-[var(--shadow-soft)]">
                  {main.map((s) => (
                    <li key={s.id}>
                      <Link href={{ pathname: '/services/[slug]', params: { slug: s.slug } }} className="flex gap-3 rounded-[var(--radius-md)] p-3 transition-colors hover:bg-bg-2">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-bg-2 text-brand">
                          <ServiceIcon name={s.icon} className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block font-semibold text-ink-0">{s.title}</span>
                          <span className="mt-0.5 line-clamp-1 block text-xs font-normal text-ink-2">{s.promise || s.summary}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li className="mt-1 border-t border-line pt-1">
                    <Link href="/other-development" className="block rounded-[var(--radius-md)] px-3 py-2 text-xs font-normal text-ink-2 hover:bg-bg-2 hover:text-ink-0">
                      {t('otherDevelopment')} →
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="text-ink-1 transition-colors hover:text-ink-0">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Button href="/contact">{t('cta')}</Button>
        </div>
        <MobileMenu
          links={[
            ...main.map((s) => ({ href: { pathname: '/services/[slug]' as const, params: { slug: s.slug } }, label: s.title })),
            ...links,
            { href: '/contact' as const, label: t('contact') },
          ]}
          ctaLabel={t('cta')}
          navLabel={t('mobileNav')}
          openLabel={t('openMenu')}
          closeLabel={t('closeMenu')}
        />
      </Container>
    </header>
  )
}
