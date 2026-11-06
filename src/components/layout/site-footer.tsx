import { getLocale, getTranslations } from 'next-intl/server'
import { Container } from '@/components/ui/container'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/locales'
import { getServices } from '@/lib/cms/queries'
import { otherServices, webServices } from '@/lib/services'
import { LanguageSwitcher } from './language-switcher'
import { ManageCookiesButton } from './manage-cookies-button'

const linkClass = 'py-1 text-ink-2 transition-colors hover:text-ink-0'
const headClass = 'mb-3 text-xs font-semibold uppercase tracking-wider text-ink-0'

export async function SiteFooter({ email, chatUrl }: { email: string; chatUrl?: string | null }) {
  const locale = (await getLocale()) as Locale
  const [t, tn, services] = await Promise.all([getTranslations('footer'), getTranslations('nav'), getServices(locale)])
  const year = new Date().getFullYear()
  const serviceLink = (s: { id: number; slug: string; title: string }) => (
    <Link key={s.id} href={{ pathname: '/services/[slug]', params: { slug: s.slug } }} className={linkClass}>
      {s.title}
    </Link>
  )
  return (
    <footer className="on-dark py-16 text-sm">
      <Container className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <p className="text-lg font-semibold text-ink-0">CoffeeProjects</p>
          <p className="mt-2 font-serif text-2xl italic text-amber">{t('tagline')}</p>
          <p className="mt-4 max-w-sm text-ink-2">{t('remote')}</p>
          <a href={`mailto:${email}`} className="mt-6 inline-block font-medium text-ink-0 underline decoration-line-hi underline-offset-4 hover:decoration-amber">
            {email}
          </a>
          <p className="mt-1 text-ink-3">{t('responseTime')}</p>
          <LanguageSwitcher className="mt-6" />
        </div>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <nav aria-label={t('colServices')} className="flex flex-col items-start">
            <p className={headClass}>{t('colServices')}</p>
            {webServices(services).map(serviceLink)}
            <Link href="/pricing" className={linkClass}>{tn('pricing')}</Link>
          </nav>
          <nav aria-label={t('colOther')} className="flex flex-col items-start">
            <p className={headClass}>{t('colOther')}</p>
            {otherServices(services).map(serviceLink)}
            <Link href="/other-development" className={linkClass}>{t('seeAll')}</Link>
          </nav>
          <nav aria-label={t('colStudio')} className="flex flex-col items-start">
            <p className={headClass}>{t('colStudio')}</p>
            <Link href="/projects" className={linkClass}>{tn('projects')}</Link>
            <Link href="/team" className={linkClass}>{tn('howWeWork')}</Link>
            <Link href="/partners" className={linkClass}>{tn('partners')}</Link>
            <Link href="/contact" className={linkClass}>{tn('contact')}</Link>
            {chatUrl && (
              <a href={chatUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>{t('chat')}</a>
            )}
          </nav>
          <nav aria-label={t('legalNav')} className="flex flex-col items-start">
            <p className={headClass}>{t('colLegal')}</p>
            <Link href="/legal-notice" className={linkClass}>{t('legal')}</Link>
            <Link href="/privacy" className={linkClass}>{t('privacy')}</Link>
            <Link href="/cookies" className={linkClass}>{t('cookies')}</Link>
            <ManageCookiesButton label={t('manageCookies')} />
          </nav>
        </div>
      </Container>
      <Container className="mt-12 border-t border-line pt-6 text-xs text-ink-3">
        © {year} CoffeeProjects. {t('rights')}
      </Container>
    </footer>
  )
}
