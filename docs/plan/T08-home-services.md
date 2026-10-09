# T08 — Home page + services index + service landing pages

**Files:**
- Create: `src/lib/format.ts`, `src/components/sections/hero.tsx`, `src/components/sections/stats-bento.tsx`, `src/components/sections/services-grid.tsx`, `src/components/sections/service-icon.tsx`, `src/components/sections/why-us.tsx`, `src/components/sections/process-steps.tsx`, `src/components/sections/stack-marquee.tsx`, `src/components/sections/faq-list.tsx`, `src/components/sections/cta-band.tsx`, `src/app/(frontend)/[locale]/services/page.tsx`, `src/app/(frontend)/[locale]/services/[slug]/page.tsx`
- Modify: `src/app/(frontend)/[locale]/page.tsx` (real home), `src/app/(frontend)/globals.css` (marquee keyframes)
- Test: `tests/unit/format.test.ts`

> next-intl `pathnames` maps internal routes to localized URLs, so **folders use the internal English names** (`services`, `team`, `projects`, `contact`, …) while URLs are `/servicios`, `/equipo`, etc.

**Interfaces:**
- Consumes: `PageShell` (T07), queries (T06), `localizedPaths` (T03), UI primitives (T02), `Service`/`Home`/`Faq` types (T04).
- Produces:
  - `formatPrice(pricing: Service['pricing'], locale: Locale, labels: { from: string; perMonth: string; custom: string; seeStore: string }): string`
  - `contactHref(type?: ProjectType)` → next-intl href object `{ pathname: '/contact', query: { type } }`
  - Section components: `<Hero home />`, `<StatsBento stats />`, `<ServicesGrid services locale />`, `<WhyUs items title />`, `<ProcessSteps steps title />` (rendered with `data-process` hooks used by T14), `<StackMarquee items title />`, `<FaqList items title />` (with `id="faq"`), `<CtaBand />`
  - Home sections expose slots for T09 (`<TeamPreview />`) and T10 (`<ProjectsPreview />`) — added there.
  - `<ServiceIcon name />`

- [ ] **Step 1: Failing test** — `tests/unit/format.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { contactHref, formatPrice } from '@/lib/format'

const labels = { from: 'Desde', perMonth: '/mes', custom: 'A medida', seeStore: 'Ver tienda' }

describe('formatPrice', () => {
  it('formats one-off prices without decimals per locale', () => {
    expect(formatPrice({ mode: 'one-off', amount: 2500 }, 'es', labels)).toBe('Desde 2500 €')
    expect(formatPrice({ mode: 'one-off', amount: 2500 }, 'en', { ...labels, from: 'From' })).toBe('From €2,500')
  })
  it('formats monthly prices', () => {
    expect(formatPrice({ mode: 'monthly', amount: 35 }, 'es', labels)).toBe('Desde 35 €/mes')
  })
  it('falls back to the custom label', () => {
    expect(formatPrice({ mode: 'custom' }, 'es', labels)).toBe('A medida')
    expect(formatPrice({ mode: 'one-off' }, 'es', labels)).toBe('A medida')
  })
  it('uses the store label for store mode', () => {
    expect(formatPrice({ mode: 'store', storeUrl: 'https://x' }, 'es', labels)).toBe('Ver tienda')
  })
})

describe('contactHref', () => {
  it('carries the project type', () => {
    expect(contactHref('ecommerce')).toEqual({ pathname: '/contact', query: { type: 'ecommerce' } })
  })
  it('omits the query without a type', () => {
    expect(contactHref()).toEqual({ pathname: '/contact' })
  })
})
```

> Note: Spanish `Intl` formats 4-digit numbers without a thousands separator (`2500 €`) — this is the correct RAE/CLDR behaviour, and the test pins it. Compare with whitespace normalized: implementation replaces non-breaking spaces with regular spaces.

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/format.test.ts
```

- [ ] **Step 3: Implement `src/lib/format.ts`**

```ts
import type { ProjectType } from '@/features/contact/options'
import type { Locale } from '@/i18n/locales'

type Pricing = { mode: 'one-off' | 'monthly' | 'custom' | 'store'; amount?: number | null; storeUrl?: string | null }
type Labels = { from: string; perMonth: string; custom: string; seeStore: string }

const intlLocale: Record<Locale, string> = { es: 'es-ES', en: 'en-IE', fr: 'fr-FR' }

export function formatPrice(pricing: Pricing, locale: Locale, labels: Labels): string {
  if (pricing.mode === 'store') return labels.seeStore
  if ((pricing.mode !== 'one-off' && pricing.mode !== 'monthly') || pricing.amount == null) return labels.custom
  const money = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : intlLocale[locale], {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
    .format(pricing.amount)
    .replace(/ | /g, ' ')
  return `${labels.from} ${money}${pricing.mode === 'monthly' ? labels.perMonth : ''}`
}

export function contactHref(type?: ProjectType) {
  return type ? { pathname: '/contact' as const, query: { type } } : { pathname: '/contact' as const }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm vitest run tests/unit/format.test.ts
```

- [ ] **Step 5: Icons + section components**

```bash
pnpm add lucide-react
```

`src/components/sections/service-icon.tsx`:

```tsx
import { Bot, Code2, Globe, Server, ShoppingCart, Sparkles, Wrench } from 'lucide-react'

const icons = { globe: Globe, 'shopping-cart': ShoppingCart, code: Code2, server: Server, bot: Bot, wrench: Wrench, sparkles: Sparkles }

export function ServiceIcon({ name, className }: { name: keyof typeof icons; className?: string }) {
  const Icon = icons[name] ?? Sparkles
  return <Icon aria-hidden className={className ?? 'h-6 w-6 text-amber'} />
}
```

`src/components/sections/hero.tsx`:

```tsx
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { TerminalLine } from '@/components/ui/terminal-line'
import type { Home } from '@/payload-types'

export async function Hero({ hero, visual }: { hero: Home['hero']; visual?: ReactNode }) {
  const t = await getTranslations('common')
  return (
    <section className="steam-glow relative isolate overflow-hidden pt-20 pb-28 sm:pt-28" aria-labelledby="hero-title">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <TerminalLine command="brew --team" />
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-amber">{hero.eyebrow}</p>
          <h1 id="hero-title" data-split className="mt-4 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">{hero.subheadline}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/contact" size="lg" data-magnetic>
              {t('requestQuote')}
            </Button>
            <Button href="/services" size="lg" variant="outline">
              {t('viewServices')}
            </Button>
          </div>
          <p className="mt-8 font-mono text-xs text-ink-3">{hero.trustLine}</p>
        </div>
        <div className="relative aspect-square w-full max-w-[560px] justify-self-center">{visual}</div>
      </Container>
    </section>
  )
}
```

`src/components/sections/stats-bento.tsx`:

```tsx
import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import type { Home } from '@/payload-types'

export function StatsBento({ stats }: { stats: NonNullable<Home['stats']> }) {
  return (
    <section aria-label="CoffeeProjects" className="py-10">
      <Container className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <GlassCard key={s.id ?? i} className={i === 0 ? 'lg:row-span-1' : ''}>
            <p className="font-display text-5xl font-semibold text-ink-0">
              {s.prefix}
              <span data-count-to={s.value}>{s.value}</span>
              {s.suffix}
            </p>
            <p className="mt-2 text-sm text-ink-2">{s.label}</p>
          </GlassCard>
        ))}
      </Container>
    </section>
  )
}
```

> The final value is rendered server-side; T14 animates from 0 only on the client and only without reduced motion — so crawlers and no-JS users never see `0`.

`src/components/sections/services-grid.tsx`:

```tsx
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/locales'
import { formatPrice } from '@/lib/format'
import type { Service } from '@/payload-types'
import { ServiceIcon } from './service-icon'

export async function ServicesGrid({ services, locale }: { services: Service[]; locale: Locale }) {
  const t = await getTranslations('common')
  const labels = { from: t('from'), perMonth: t('perMonth'), custom: t('custom'), seeStore: t('seeStore') }
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-reveal-group>
      {services.map((s, i) => (
        <li key={s.id} className={i === 0 ? 'lg:col-span-2' : ''} data-reveal>
          <Link href={{ pathname: '/services/[slug]', params: { slug: s.slug } }} className="group block h-full">
            <GlassCard className="flex h-full flex-col">
              <ServiceIcon name={s.icon} />
              <h3 className="mt-5 text-2xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-ink-2">{s.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(s.tags ?? []).slice(0, 4).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <div className="mt-auto flex items-end justify-between pt-8">
                <div>
                  <p className="font-display text-xl text-amber-hi">{formatPrice(s.pricing, locale, labels)}</p>
                  <p className="text-xs text-ink-3">
                    {t('typicalTime')}: {s.typicalTime}
                  </p>
                </div>
                <span className="text-sm text-ink-1 transition-transform group-hover:translate-x-1">{t('learnMore')} →</span>
              </div>
            </GlassCard>
          </Link>
        </li>
      ))}
    </ul>
  )
}
```

`src/components/sections/why-us.tsx`:

```tsx
import { GlassCard } from '@/components/ui/glass-card'
import { Section } from '@/components/ui/section'

export function WhyUs({ title, items }: { title: string; items: { id?: string | null; title: string; text: string }[] }) {
  return (
    <Section id="why" eyebrow="// why" title={title}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
        {items.map((it, i) => (
          <li key={it.id ?? i} data-reveal>
            <GlassCard className="h-full">
              <p className="font-mono text-xs text-amber">0{i + 1}</p>
              <h3 className="mt-3 text-xl font-semibold">{it.title}</h3>
              <p className="mt-2 text-ink-2">{it.text}</p>
            </GlassCard>
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

`src/components/sections/process-steps.tsx`:

```tsx
import { Section } from '@/components/ui/section'

export function ProcessSteps({ title, steps }: { title: string; steps: { id?: string | null; title: string; text: string }[] }) {
  return (
    <Section id="process" eyebrow="// process" title={title}>
      <ol className="relative grid gap-6 border-l border-line-amber pl-8 lg:grid-cols-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-10" data-process>
        {steps.map((s, i) => (
          <li key={s.id ?? i} className="relative" data-process-step>
            <span className="absolute -left-[41px] top-1 grid h-5 w-5 place-items-center rounded-full bg-amber font-mono text-[10px] text-bg-0 lg:-top-[51px] lg:left-0">
              {i + 1}
            </span>
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
```

`src/components/sections/stack-marquee.tsx` (real SVG brand logos from `simple-icons`, text-only fallback for names without an icon):

```bash
pnpm add simple-icons
```

```tsx
import * as icons from 'simple-icons'
import { Section } from '@/components/ui/section'

// Map display name → simple-icons export. Verify each export exists in the installed version
// (`node -e "console.log(Object.keys(require('simple-icons')).filter(k=>/next|react|astro/i.test(k)))"`);
// remove any that don't (some brands, e.g. Java, are not in simple-icons) — they fall back to text.
const iconKeys: Record<string, string> = {
  'Next.js': 'siNextdotjs',
  React: 'siReact',
  Astro: 'siAstro',
  TypeScript: 'siTypescript',
  'Node.js': 'siNodedotjs',
  'Payload CMS': 'siPayloadcms',
  'Tailwind CSS': 'siTailwindcss',
  GSAP: 'siGreensock',
  'Three.js': 'siThreedotjs',
  Python: 'siPython',
  Lua: 'siLua',
  PostgreSQL: 'siPostgresql',
  Stripe: 'siStripe',
  Shopify: 'siShopify',
  Vercel: 'siVercel',
  Kotlin: 'siKotlin',
  Vue: 'siVuedotjs',
}

function Logo({ name }: { name: string }) {
  const icon = (icons as unknown as Record<string, { path: string } | undefined>)[iconKeys[name] ?? '']
  if (!icon) return null
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d={icon.path} />
    </svg>
  )
}

export function StackMarquee({ title, items }: { title: string; items: string[] }) {
  const row = [...items, ...items]
  return (
    <Section id="stack" eyebrow="// stack" title={title}>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <ul className="marquee flex w-max gap-3" aria-label={title}>
          {row.map((item, i) => (
            <li
              key={`${item}-${i}`}
              aria-hidden={i >= items.length}
              className="flex items-center gap-2 rounded-full border border-line-hi bg-bg-2 px-5 py-2 font-mono text-sm text-ink-1"
            >
              <Logo name={item} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
```

> Import cost: `import * as icons` can pull the whole icon set into the server bundle only (this is a Server Component), so no client JS is added. If build time suffers, replace with named imports of the verified keys.

Append to `globals.css`:

```css
@keyframes marquee {
  to { transform: translateX(-50%); }
}
.marquee { animation: marquee 40s linear infinite; }
.marquee:hover { animation-play-state: paused; }
```

`src/components/sections/faq-list.tsx`:

```tsx
import { Section } from '@/components/ui/section'

export function FaqList({ title, items }: { title: string; items: { id: string | number; question: string; answer: string }[] }) {
  return (
    <Section id="faq" eyebrow="// faq" title={title}>
      <div className="divide-y divide-line rounded-[var(--radius-lg)] border border-line">
        {items.map((f) => (
          <details key={f.id} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg text-ink-0">
              {f.question}
              <span aria-hidden className="font-mono text-amber transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 text-ink-2">{f.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
```

`src/components/sections/cta-band.tsx` (GET form → prefilled full contact form, works without JS):

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { buttonClasses } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { projectTypes } from '@/features/contact/options'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'

export async function CtaBand() {
  const [t, locale] = await Promise.all([getTranslations('contact'), getLocale()])
  const input = 'h-12 w-full rounded-full border border-line-hi bg-bg-1 px-5 text-ink-0 placeholder:text-ink-3 focus:border-amber'
  return (
    <section className="py-24" aria-labelledby="cta-title">
      <Container>
        <div className="steam-glow rounded-[var(--radius-lg)] border border-line-amber bg-bg-1 p-8 sm:p-14">
          <h2 id="cta-title" className="text-4xl font-semibold sm:text-5xl">{t('quickTitle')}</h2>
          <p className="mt-4 max-w-2xl text-ink-2">{t('quickLead')}</p>
          <form action={buildPath('/contact', locale as Locale)} method="get" className="mt-8 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="sr-only" htmlFor="cta-name">{t('name')}</label>
            <input id="cta-name" name="name" autoComplete="name" placeholder={t('name')} className={input} />
            <label className="sr-only" htmlFor="cta-email">{t('email')}</label>
            <input id="cta-email" name="email" type="email" autoComplete="email" placeholder={t('email')} className={input} />
            <label className="sr-only" htmlFor="cta-type">{t('projectType')}</label>
            <select id="cta-type" name="type" className={input} defaultValue="web">
              {projectTypes.map((p) => (
                <option key={p} value={p}>{t(`projectTypes.${p}`)}</option>
              ))}
            </select>
            <button type="submit" className={buttonClasses({ size: 'lg' })}>{t('quickCta')}</button>
          </form>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 6: Home page `src/app/(frontend)/[locale]/page.tsx`**

```tsx
import { setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { Section } from '@/components/ui/section'
import { CtaBand } from '@/components/sections/cta-band'
import { FaqList } from '@/components/sections/faq-list'
import { Hero } from '@/components/sections/hero'
import { ProcessSteps } from '@/components/sections/process-steps'
import { ServicesGrid } from '@/components/sections/services-grid'
import { StackMarquee } from '@/components/sections/stack-marquee'
import { StatsBento } from '@/components/sections/stats-bento'
import { WhyUs } from '@/components/sections/why-us'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getFaqs, getHome, getServices } from '@/lib/cms/queries'
import { getTranslations } from 'next-intl/server'

export const revalidate = 3600

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const [home, services, faqs, t] = await Promise.all([getHome(locale), getServices(locale), getFaqs(locale), getTranslations('common')])

  return (
    <PageShell locale={locale} alternates={localizedPaths('/')}>
      <Hero hero={home.hero} />
      <StatsBento stats={home.stats ?? []} />
      <Section id="services" eyebrow="// services" title={home.sections.servicesTitle} lead={home.sections.servicesLead}>
        <ServicesGrid services={services} locale={locale} />
      </Section>
      <WhyUs title={home.sections.whyTitle} items={home.whyUs ?? []} />
      <ProcessSteps title={home.sections.processTitle} steps={home.process ?? []} />
      {/* T09: <TeamPreview /> — T10: <ProjectsPreview /> */}
      <StackMarquee title={home.sections.stackTitle} items={home.stack ?? []} />
      <FaqList title={t('faqTitle')} items={faqs} />
      <CtaBand />
    </PageShell>
  )
}
```

- [ ] **Step 7: Services index `src/app/(frontend)/[locale]/services/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { ServicesGrid } from '@/components/sections/services-grid'
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getHome, getServices } from '@/lib/cms/queries'

export const revalidate = 3600

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [home, services, t] = await Promise.all([getHome(locale), getServices(locale), getTranslations('nav')])
  return (
    <PageShell locale={locale} alternates={localizedPaths('/services')}>
      <Section eyebrow={`// ${t('services').toLowerCase()}`} title={<span className="block text-5xl sm:text-7xl">{home.sections.servicesTitle}</span>} lead={home.sections.servicesLead}>
        <ServicesGrid services={services} locale={locale} />
      </Section>
      <CtaBand />
    </PageShell>
  )
}
```

> Only the hero of each page uses `<h1>`. The `Section` component renders `<h2>`; for index pages where the section title is the page title, render the title through `Section`'s `title` and change `Section` to accept `as?: 'h1' | 'h2'` (default `'h2'`) — implement that prop now and pass `as="h1"` here.

- [ ] **Step 8: Service landing `src/app/(frontend)/[locale]/services/[slug]/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { CtaBand } from '@/components/sections/cta-band'
import { FaqList } from '@/components/sections/faq-list'
import { ServiceIcon } from '@/components/sections/service-icon'
import { ServicesGrid } from '@/components/sections/services-grid'
import { Badge } from '@/components/ui/badge'
import { Button, buttonClasses } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import { RichText } from '@/components/ui/rich-text'
import { Section } from '@/components/ui/section'
import { type Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getAllSlugs, getFaqs, getService, getServices } from '@/lib/cms/queries'
import { contactHref, formatPrice } from '@/lib/format'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const all = await getAllSlugs('services')
  return all.map((slugs) => ({ slug: slugs[params.locale as Locale] }))
}

export default async function ServicePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)
  const found = await getService(locale, slug)
  if (!found) notFound()
  const { doc: s, slugs } = found

  const [all, faqs, t] = await Promise.all([getServices(locale), getFaqs(locale), getTranslations('common')])
  const labels = { from: t('from'), perMonth: t('perMonth'), custom: t('custom'), seeStore: t('seeStore') }
  const serviceFaq = (s.faq ?? []).map((f, i) => ({ id: f.id ?? i, question: f.question, answer: f.answer }))
  const faqItems = serviceFaq.length > 0 ? serviceFaq : faqs.slice(0, 4)
  const storeUrl = s.pricing.mode === 'store' ? s.pricing.storeUrl : null

  return (
    <PageShell locale={locale} alternates={localizedPaths('/services/[slug]', slugs)}>
      <section className="steam-glow pt-20 pb-16" aria-labelledby="service-title">
        <Container className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <ServiceIcon name={s.icon} className="h-10 w-10 text-amber" />
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-amber">{s.title}</p>
            <h1 id="service-title" data-split className="mt-3 text-5xl font-semibold leading-tight sm:text-6xl">
              {s.promise}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2">{s.summary}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href={contactHref(s.contactType)} size="lg" data-magnetic>
                {t('requestQuote')}
              </Button>
              {storeUrl && (
                <a href={storeUrl} className={buttonClasses({ size: 'lg', variant: 'outline' })} target="_blank" rel="noopener noreferrer">
                  {t('seeStore')} ↗
                </a>
              )}
            </div>
          </div>
          <GlassCard className="self-start">
            <dl className="grid gap-6">
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink-3">{t('from')}</dt>
                <dd className="font-display text-4xl text-amber-hi">{formatPrice(s.pricing, locale, labels).replace(`${t('from')} `, '')}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink-3">{t('typicalTime')}</dt>
                <dd className="text-xl text-ink-0">{s.typicalTime}</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                {(s.tags ?? []).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              {s.note && <p className="text-sm text-ink-2">{s.note}</p>}
            </dl>
          </GlassCard>
        </Container>
      </section>

      <Section eyebrow="// includes" title={t('deliverables')}>
        <ul className="grid gap-4 sm:grid-cols-2" data-reveal-group>
          {(s.features ?? []).map((f, i) => (
            <li key={f.id ?? i} data-reveal className="flex items-start gap-3 rounded-[var(--radius-md)] border border-line bg-bg-1 p-5">
              <span aria-hidden className="mt-1 text-mint">✓</span>
              <span className="text-ink-0">{f.text}</span>
            </li>
          ))}
        </ul>
        {s.body && <RichText data={s.body} className="mt-12" />}
      </Section>

      <FaqList title={t('faqTitle')} items={faqItems} />

      <Section eyebrow="// more" title={t('otherServices')}>
        <ServicesGrid services={all.filter((o) => o.id !== s.id).slice(0, 3)} locale={locale} />
      </Section>
      <CtaBand />
    </PageShell>
  )
}
```

> Testimonials slot: intentionally absent until real testimonials exist (spec §8, Q6).

- [ ] **Step 9: Manual check**

`pnpm dev`: `/` shows all sections with seeded content; `/servicios/tiendas-online` renders, its language switcher goes to `/en/services/online-stores` and `/fr/services/boutiques-en-ligne`; "Pide tu presupuesto" links to `/contacto?type=ecommerce`; `/servicios/no-existe` → 404; the CTA band GET form lands on `/contacto?name=…&email=…&type=…`.

- [ ] **Step 10: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(pages): add home, services index and per-service landing pages"
```
