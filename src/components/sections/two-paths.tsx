import { getTranslations } from 'next-intl/server'
import { WebPlanList } from '@/components/pricing/plan-list'
import type { WebPlan } from '@/components/pricing/plan-cards'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/locales'
import { Section } from '@/components/ui/section'
import { ServiceIcon } from './service-icon'
import type { Home, Service } from '@/payload-types'

type Paths = NonNullable<Home['paths']>

/** "New website" vs "improve my website": the two entry points of the home page. */
export async function TwoPaths({ paths, newService, redesignService, extras, plans = [], locale, vat = '' }: {
  paths: Paths
  newService?: Service
  redesignService?: Service
  extras: { service: Service; price: string }[]
  /** Every web plan: the "new website" card lists them all instead of a single "from" price. */
  plans?: WebPlan[]
  locale: Locale
  vat?: string
}) {
  const [t, tc] = await Promise.all([getTranslations('home'), getTranslations('common')])
  const cards = [
    { key: 'new', icon: 'globe' as const, title: paths.newTitle, text: paths.newText, points: paths.newPoints ?? [], price: paths.newPrice, service: newService, cta: t('seeNew'), dark: false },
    { key: 'redesign', icon: 'refresh' as const, title: paths.redesignTitle, text: paths.redesignText, points: paths.redesignPoints ?? [], price: paths.redesignPrice, service: redesignService, cta: t('seeRedesign'), dark: true },
  ]
  return (
    <Section id="services" eyebrow={t('servicesEyebrow')} title={paths.title || t('pathsTitle')}>
      <ul className="grid gap-6 lg:grid-cols-2" data-reveal-group>
        {cards.map((c) => (
          <li key={c.key} data-reveal className={c.dark ? 'on-dark edge-gradient card-lift relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] p-8 sm:p-10' : 'edge-gradient card-lift relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1 p-8 sm:p-10'}>
            <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[linear-gradient(135deg,#c2410c,#e11d48)] text-white shadow-[var(--shadow-amber)]">
              <ServiceIcon name={c.icon} className="h-6 w-6" />
            </span>
            <h3 className="mt-6 text-2xl font-semibold sm:text-3xl">{c.title}</h3>
            <p className="mt-3 text-ink-2">{c.text}</p>
            <ul className="mt-6 grid gap-2.5">
              {c.points.map((p, i) => (
                <li key={p.id ?? i} className="flex gap-3 text-ink-1">
                  <svg viewBox="0 0 24 24" aria-hidden className="mt-1 h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {p.text}
                </li>
              ))}
            </ul>
            {c.key === 'new' && plans.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold text-ink-1">{t('plansLead')}</p>
                <WebPlanList plans={plans} locale={locale} vat={vat} from={tc('from')} markFeatured={false} />
                <Link href="/pricing" className="mt-3 inline-block text-sm font-medium text-brand hover:text-brand-hi">
                  {t('seeAllPlans')} <span aria-hidden>→</span>
                </Link>
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
              {c.price && <p className="font-semibold text-ink-0">{c.price}</p>}
              {c.service && (
                <Button href={{ pathname: '/services/[slug]', params: { slug: c.service.slug } }} variant={c.dark ? 'primary' : 'outline'}>
                  {c.cta} →
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {extras.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {extras.map(({ service: s, price }) => (
            <li key={s.id}>
              <Button href={{ pathname: '/services/[slug]', params: { slug: s.slug } }} variant="ghost" className="w-full justify-between border border-line bg-bg-1">
                <span className="flex items-center gap-3">
                  <ServiceIcon name={s.icon} className="h-5 w-5 text-brand" />
                  {s.title}
                </span>
                <span className="text-sm font-normal text-ink-2">{price} →</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
