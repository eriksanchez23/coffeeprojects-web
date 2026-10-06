import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/ui/container'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './language-switcher'
import { ManageCookiesButton } from './manage-cookies-button'

export async function SiteFooter({ email, chatUrl }: { email: string; chatUrl?: string | null }) {
  const t = await getTranslations('footer')
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
            <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber">{t('chat')}</a>
          )}
          <LanguageSwitcher className="mt-2" />
        </div>
        <nav aria-label={t('legalNav')} className="flex flex-col gap-2 md:items-end">
          <Link href="/legal-notice" className="hover:text-ink-0">{t('legal')}</Link>
          <Link href="/privacy" className="hover:text-ink-0">{t('privacy')}</Link>
          <Link href="/cookies" className="hover:text-ink-0">{t('cookies')}</Link>
          <ManageCookiesButton label={t('manageCookies')} />
        </nav>
      </Container>
      <Container className="mt-10 font-mono text-xs text-ink-3">
        © {year} coffeeProjects. {t('rights')}
      </Container>
    </footer>
  )
}
