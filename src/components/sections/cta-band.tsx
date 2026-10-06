import { getLocale, getTranslations } from 'next-intl/server'
import { buttonClasses } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { type ProjectType, projectTypes } from '@/features/contact/options'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'

/**
 * GET form that only carries the project type to the full contact form (works without JS).
 * Personal data (name, email) is deliberately never put in the URL; the contact page collects it.
 */
export async function CtaBand({ defaultType = 'web' }: { defaultType?: ProjectType }) {
  const [t, locale] = await Promise.all([getTranslations('contact'), getLocale()])
  const input = 'h-12 w-full rounded-full border border-line-hi bg-bg-1 px-5 text-ink-0 placeholder:text-ink-3 focus:border-amber'
  return (
    <section className="py-24" aria-labelledby="cta-title">
      <Container>
        <div className="steam-glow rounded-[var(--radius-lg)] border border-line-amber bg-bg-1 p-8 sm:p-14">
          <h2 id="cta-title" className="text-4xl font-semibold sm:text-5xl">{t('quickTitle')}</h2>
          <p className="mt-4 max-w-2xl text-ink-2">{t('quickLead')}</p>
          <form action={buildPath('/contact', locale as Locale)} method="get" className="mt-8 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="cta-type">{t('projectType')}</label>
            <select id="cta-type" name="type" className={input} defaultValue={defaultType}>
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
