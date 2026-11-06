import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { ServiceIcon } from './service-icon'
import type { Home, Service } from '@/payload-types'

type Paths = NonNullable<Home['paths']>

/** "New website" vs "improve my website": the two entry points of the home page. */
export async function TwoPaths({ paths, newService, redesignService, extras }: {
  paths: Paths
  newService?: Service
  redesignService?: Service
  extras: { service: Service; price: string }[]
}) {
  const t = await getTranslations('home')
  const cards = [
    { key: 'new', icon: 'globe' as const, title: paths.newTitle, text: paths.newText, points: paths.newPoints ?? [], price: paths.newPrice, service: newService, cta: t('seeNew'), dark: false },
    { key: 'redesign', icon: 'refresh' as const, title: paths.redesignTitle, text: paths.redesignText, points: paths.redesignPoints ?? [], price: paths.redesignPrice, service: redesignService, cta: t('seeRedesign'), dark: true },
  ]
  return (
    <Section id="services" eyebrow={t('servicesEyebrow')} title={paths.title || t('pathsTitle')}>
      <ul className="grid gap-6 lg:grid-cols-2" data-reveal-group>
        {cards.map((c) => (
          <li key={c.key} data-reveal className={c.dark ? 'on-dark flex flex-col rounded-[var(--radius-lg)] p-8 sm:p-10' : 'flex flex-col rounded-[var(--radius-lg)] border border-line bg-bg-1 p-8 sm:p-10'}>
            <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-bg-2 text-brand">
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
