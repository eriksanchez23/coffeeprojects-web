import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { TerminalLine } from '@/components/ui/terminal-line'
import type { Home } from '@/payload-types'

export async function Hero({ hero, visual }: { hero: Home['hero']; visual?: ReactNode }) {
  const [t, ts] = await Promise.all([getTranslations('common'), getTranslations('sections')])
  return (
    <section className="steam-glow relative isolate overflow-hidden pt-20 pb-28 sm:pt-28" aria-labelledby="hero-title">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <TerminalLine command={ts("heroCommand")} />
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
