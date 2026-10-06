import '../globals.css'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { ConsentBanner } from '@/components/layout/consent-banner'
import { AttributionCapture } from '@/components/tracking/attribution-capture'
import { MetaPixel } from '@/components/tracking/meta-pixel'
import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import { fontVariables } from '@/lib/fonts'

// Logged once per server process; constant message, nothing user-specific.
let warnedMissingPixel = false
function warnIfPixelMissing(pixelId: string | undefined) {
  if (!env.isProduction || pixelId || warnedMissingPixel) return
  warnedMissingPixel = true
  console.warn('NEXT_PUBLIC_META_PIXEL_ID is not set in production: Meta Pixel is disabled')
}

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

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  warnIfPixelMissing(pixelId)

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="grain bg-bg-0 text-ink-1">
        <NextIntlClientProvider>
          {children}
          <ConsentBanner />
          <MetaPixel pixelId={pixelId} />
          <AttributionCapture />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
