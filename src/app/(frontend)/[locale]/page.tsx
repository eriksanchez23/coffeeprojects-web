import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

export default function HomeStub({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  setRequestLocale(locale)
  const t = useTranslations('meta')
  return (
    <main className="p-10">
      <h1 className="text-4xl">{t('defaultTitle')}</h1>
      <LanguageSwitcher className="mt-6" />
    </main>
  )
}
