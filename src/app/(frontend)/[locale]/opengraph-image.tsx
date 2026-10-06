import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { OgCard } from '@/lib/seo/og-card'

export const alt = 'coffeeProjects'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'footer' })
  return new ImageResponse(<OgCard eyebrow="~ coffeeprojects $ brew" headline={t('tagline')} />, size)
}
