import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { HeroShowcase } from '@/components/showcase/hero-showcase'
import type { ShowcaseSlide } from '@/lib/showcase'
import type { Home } from '@/payload-types'

/** "Webs profesionales que *consiguen clientes*": the text between asterisks gets the serif italic accent. */
function Accent({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="text-gradient font-serif font-normal italic">
            {part}
          </em>
        ) : (
          part
        ),
      )}
    </>
  )
}

export async function Hero({ hero, slides = [] }: { hero: Home['hero']; slides?: ShowcaseSlide[] }) {
  const t = await getTranslations('home')
  return (
    <section className="hero-wash relative isolate overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28" aria-labelledby="hero-title">
      <div aria-hidden className="aurora">
        <span />
        <span />
        <span />
      </div>
      <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber">{hero.eyebrow}</p>
          <h1 id="hero-title" className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
            <Accent text={hero.headline} />
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">{hero.subheadline}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href={{ pathname: '/contact', query: { type: 'web' } }} size="lg">
              {t('ctaNew')}
            </Button>
            <Button href={{ pathname: '/contact', query: { type: 'redesign' } }} size="lg" variant="outline">
              {t('ctaImprove')}
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            {hero.trustLine
              .split('·')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 text-mint" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {item}
                </li>
              ))}
          </ul>
        </div>
        <HeroShowcase slides={slides} showLabel={t.raw('showProject') as string} />
      </Container>
    </section>
  )
}
