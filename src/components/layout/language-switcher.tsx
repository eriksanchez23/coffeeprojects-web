'use client'
import { useLocale, useTranslations } from 'next-intl'
import type { SyntheticEvent } from 'react'
import { type Locale, localeLabels, locales } from '@/i18n/locales'
import { switchHref } from '@/i18n/switch-href'
import { clsx } from 'clsx'
import { useAlternates } from './alternates-context'

const homePaths: Record<Locale, string> = { es: '/', en: '/en', fr: '/fr' }

export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale() as Locale
  const alternates = useAlternates()
  const t = useTranslations('nav')
  // The server renders the plain alternate (static pages stay static); right before it is used (hover, focus, click,
  // middle-click) the link picks up the current query string and hash, so preselected choices survive the switch.
  const carry = (base: string) => (e: SyntheticEvent<HTMLAnchorElement>) => {
    e.currentTarget.href = switchHref(base, window.location)
  }

  return (
    <nav
      aria-label={t('language')}
      className={clsx('flex items-center gap-1 text-xs font-medium', className)}
    >
      {locales.map((locale) => {
        const base = alternates?.[locale] ?? homePaths[locale]
        const update = carry(base)
        return (
          <a
            key={locale}
            href={base}
            onPointerEnter={update}
            onFocus={update}
            onClick={update}
            onAuxClick={update}
            onContextMenu={update}
            hrefLang={locale}
            lang={locale}
            aria-current={locale === current ? 'true' : undefined}
            title={localeLabels[locale]}
            className={clsx(
              'inline-flex min-h-8 min-w-10 items-center justify-center rounded-full px-2.5 py-1 uppercase transition-colors',
              locale === current ? 'bg-ink-0 text-bg-0' : 'text-ink-2 hover:text-ink-0',
            )}
          >
            {locale}
          </a>
        )
      })}
    </nav>
  )
}
