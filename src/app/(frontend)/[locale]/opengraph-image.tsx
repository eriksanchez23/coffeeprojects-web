import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'
import { routing } from '@/i18n/routing'
import { OgCard } from '@/lib/seo/og-card'

export const alt = 'CoffeeProjects'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // Every OG route re-exports this handler: unknown locales 404 instead of rendering a new image per URL.
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'footer' })
  return new ImageResponse(<OgCard eyebrow="~ coffeeprojects $ brew" headline={t('tagline')} />, size)
}
