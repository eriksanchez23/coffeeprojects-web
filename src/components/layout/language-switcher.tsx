'use client'
import { useLocale, useTranslations } from 'next-intl'
import { type Locale, localeLabels, locales } from '@/i18n/locales'
import { clsx } from 'clsx'
import { useAlternates } from './alternates-context'

const homePaths: Record<Locale, string> = { es: '/', en: '/en', fr: '/fr' }

export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale() as Locale
  const alternates = useAlternates()
  const t = useTranslations('nav')

  return (
    <nav aria-label={t('language')} className={clsx('flex items-center gap-1 font-mono text-xs', className)}>
      {locales.map((locale) => (
        <a
          key={locale}
          href={alternates?.[locale] ?? homePaths[locale]}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === current ? 'true' : undefined}
          title={localeLabels[locale]}
          className={clsx(
            'inline-flex min-h-8 min-w-10 items-center justify-center rounded-full px-2.5 py-1 uppercase transition-colors',
            locale === current ? 'bg-amber text-bg-0' : 'text-ink-2 hover:text-ink-0',
          )}
        >
          {locale}
        </a>
      ))}
    </nav>
  )
}
