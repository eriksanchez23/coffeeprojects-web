import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/locales'
import { getService } from '@/lib/cms/queries'
import { OgCard } from '@/lib/seo/og-card'

export const alt = 'coffeeProjects'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function ServiceOgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const found = await getService(locale as Locale, slug)
  if (!found) {
    const t = await getTranslations({ locale, namespace: 'footer' })
    return new ImageResponse(<OgCard eyebrow="~ coffeeprojects $ brew" headline={t('tagline')} />, size)
  }
  return new ImageResponse(<OgCard eyebrow={found.doc.title} headline={found.doc.promise} />, size)
}
