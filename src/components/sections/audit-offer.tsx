import { getLocale, getTranslations } from 'next-intl/server'
import { buttonClasses } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { buildPath } from '@/i18n/build-path'
import type { Locale } from '@/i18n/locales'
import type { Home } from '@/payload-types'

/**
 * "Is your website costing you customers?" + free review offer. A GET form that only carries the website URL
 * (public data) to the contact form, which collects the email with consent and anti-spam; works without JS.
 */
export async function AuditOffer({ audit }: { audit: NonNullable<Home['audit']> }) {
  const [t, tc, locale] = await Promise.all([getTranslations('home'), getTranslations('contact'), getLocale()])
  if (!audit.title) return null
  return (
    <Section id="review" eyebrow={audit.eyebrow ?? undefined} title={audit.title} lead={audit.lead} className="bg-bg-2">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {(audit.symptoms ?? []).map((s, i) => (
            <li key={s.id ?? i} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-line bg-bg-1 px-4 py-3 text-ink-1">
              <svg viewBox="0 0 24 24" aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-berry" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {s.text}
            </li>
          ))}
        </ul>
        <div className="on-dark self-start rounded-[var(--radius-lg)] p-8 sm:p-10">
          <h3 className="text-2xl font-semibold sm:text-3xl">{audit.offerTitle}</h3>
          <p className="mt-3 text-ink-2">{audit.offerText}</p>
          <form action={buildPath('/contact', locale as Locale)} method="get" className="mt-8 grid gap-3">
            <input type="hidden" name="type" value="audit" />
            <label htmlFor="audit-url" className="text-sm font-medium text-ink-1">{t('auditUrlLabel')}</label>
            <input
              id="audit-url"
              name="url"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder={tc('urlPlaceholder')}
              className="h-14 w-full rounded-[var(--radius-md)] border border-line-hi bg-bg-1 px-4 text-ink-0 placeholder:text-ink-3 focus:border-amber"
            />
            <button type="submit" className={buttonClasses({ size: 'lg' })}>{t('auditCta')}</button>
            <p className="text-xs text-ink-3">{t('auditNote')}</p>
          </form>
        </div>
      </div>
    </Section>
  )
}
