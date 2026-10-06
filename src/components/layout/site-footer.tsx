'use client'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/container'
import { openConsentSettings } from '@/features/tracking/use-consent'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './language-switcher'

export function SiteFooter({ email, chatUrl }: { email: string; chatUrl?: string | null }) {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-line py-14 text-sm text-ink-2">
      <Container className="grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-ink-0">{t('tagline')}</p>
          <p className="mt-3">{t('remote')}</p>
        </div>
        <div className="flex flex-col gap-2">
          <a href={`mailto:${email}`} className="text-ink-0 hover:text-amber">{email}</a>
          {chatUrl && (
            <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber">Chat</a>
          )}
          <LanguageSwitcher className="mt-2" />
        </div>
        <nav aria-label="Legal" className="flex flex-col gap-2 md:items-end">
          <Link href="/legal-notice" className="hover:text-ink-0">{t('legal')}</Link>
          <Link href="/privacy" className="hover:text-ink-0">{t('privacy')}</Link>
          <Link href="/cookies" className="hover:text-ink-0">{t('cookies')}</Link>
          <button type="button" onClick={openConsentSettings} className="text-left hover:text-ink-0 md:text-right">
            {t('manageCookies')}
          </button>
        </nav>
      </Container>
      <Container className="mt-10 font-mono text-xs text-ink-3">
        © {year} coffeeProjects. {t('rights')}
      </Container>
    </footer>
  )
}
