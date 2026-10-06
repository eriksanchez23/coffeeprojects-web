import '../globals.css'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { JsonLd } from '@/components/seo/json-ld'
import { ConsentBanner } from '@/components/layout/consent-banner'
import { CursorGlow } from '@/components/motion/cursor-glow'
import { MotionProvider } from '@/components/motion/motion-provider'
import { AttributionCapture } from '@/components/tracking/attribution-capture'
import { MetaPixel } from '@/components/tracking/meta-pixel'
import type { Locale } from '@/i18n/locales'
import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import { getSettings } from '@/lib/cms/queries'
import { fontVariables } from '@/lib/fonts'
import { organizationLd, websiteLd } from '@/lib/seo/jsonld'

const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0b0706"/><g fill="none" stroke="#f5a742" stroke-width="2"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/></g></svg>',
)}`

// Set by Vercel in its build and runtime environments.
const onVercel = process.env.VERCEL === '1'

// Logged once per server process; constant message, nothing user-specific.
let warnedMissingPixel = false
function warnIfPixelMissing(pixelId: string | undefined) {
  if (!env.isProduction || pixelId || warnedMissingPixel) return
  warnedMissingPixel = true
  console.warn('NEXT_PUBLIC_META_PIXEL_ID is not set in production: Meta Pixel is disabled')
}

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  // Inline brand cup: without an icon link browsers request /favicon.ico, which does not exist (404 in the console).
  icons: { icon: FAVICON },
  // Covers pages without their own buildMetadata (e.g. 404); staging is never indexable.
  ...(env.isProduction ? {} : { robots: { index: false, follow: false } }),
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
  const settings = await getSettings(locale as Locale)

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  warnIfPixelMissing(pixelId)

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      {/* The page background lives on <html> (globals.css) so the cursor glow (z-index -10) paints behind content. */}
      <body className="grain text-ink-1">
        <JsonLd data={[organizationLd(settings.contactEmail), websiteLd(locale as Locale)]} />
        <NextIntlClientProvider>
          <MotionProvider>
            {children}
            <ConsentBanner />
            <MetaPixel pixelId={pixelId} />
            <AttributionCapture />
          </MotionProvider>
          <CursorGlow />
        </NextIntlClientProvider>
        {/* Their scripts are served by Vercel (/_vercel/*); elsewhere (next start, CI, Lighthouse) they would only 404. */}
        {onVercel && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}
