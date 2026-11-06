import { getLocale, getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import type { ProjectType } from '@/features/contact/options'
import type { Locale } from '@/i18n/locales'
import { getSettings } from '@/lib/cms/queries'

/** Final espresso band of every page: one primary action (contact form, type preselected) and a plain email link. */
export async function CtaBand({ defaultType = 'web' }: { defaultType?: ProjectType }) {
  const locale = (await getLocale()) as Locale
  const [t, settings] = await Promise.all([getTranslations('contact'), getSettings(locale)])
  return (
    <section className="py-20 sm:py-24" aria-labelledby="cta-title">
      <Container>
        <div className="on-dark relative overflow-hidden rounded-[var(--radius-lg)] px-6 py-14 sm:px-14 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(245_167_66/0.22),transparent_70%)]" />
          <h2 id="cta-title" className="max-w-2xl text-3xl font-semibold sm:text-5xl">{t('quickTitle')}</h2>
          <p className="mt-5 max-w-2xl text-lg text-ink-2">{t('quickLead')}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href={{ pathname: '/contact', query: { type: defaultType } }} size="lg">
              {t('quickCta')}
            </Button>
            <a
              href={`mailto:${settings.contactEmail}`}
              data-track="contact-email"
              className="inline-flex h-14 items-center rounded-[var(--radius-md)] border border-line-hi px-7 font-medium text-ink-0 transition-colors hover:border-line-amber"
            >
              {t('quickEmail')}
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}
