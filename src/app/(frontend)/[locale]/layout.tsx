import '../globals.css'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { ConsentBanner } from '@/components/layout/consent-banner'
import { routing } from '@/i18n/routing'
import { fontVariables } from '@/lib/fonts'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="grain bg-bg-0 text-ink-1">
        <NextIntlClientProvider>
          {children}
          <ConsentBanner />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
