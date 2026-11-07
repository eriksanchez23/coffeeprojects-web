import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'
import { routing } from '@/i18n/routing'
import { getService } from '@/lib/cms/queries'
import { OgCard } from '@/lib/seo/og-card'

export const alt = 'CoffeeProjects'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function ServiceOgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  // OG image paths bypass the proxy: an unknown locale 404s instead of reaching the CMS.
  if (!hasLocale(routing.locales, locale)) notFound()
  const found = await getService(locale, slug)
  if (!found) {
    const t = await getTranslations({ locale, namespace: 'footer' })
    return new ImageResponse(<OgCard eyebrow="~ coffeeprojects $ brew" headline={t('tagline')} />, size)
  }
  return new ImageResponse(<OgCard eyebrow={found.doc.title} headline={found.doc.promise} />, size)
}
