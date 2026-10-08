import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './language-switcher'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'

export async function SiteHeader() {
  const t = await getTranslations('nav')
  const links = [
    { href: '/services' as const, label: t('services') },
    { href: '/pricing' as const, label: t('pricing') },
    { href: '/team' as const, label: t('team') },
    { href: '/projects' as const, label: t('projects') },
    { href: { pathname: '/' as const, hash: 'faq' }, label: t('faq') },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg-0/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label={t('mainNav')} className="hidden items-center gap-7 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="text-ink-2 transition-colors hover:text-ink-0">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Button href="/contact">{t('cta')}</Button>
        </div>
        {/* The long "earn with us" label would crowd the desktop bar; the mobile panel has room for it. */}
        <MobileMenu links={[...links, { href: '/partners' as const, label: t('partners') }]} ctaLabel={t('cta')} navLabel={t('mobileNav')} openLabel={t('openMenu')} closeLabel={t('closeMenu')} />
      </Container>
    </header>
  )
}
