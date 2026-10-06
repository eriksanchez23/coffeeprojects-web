import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/layout/page-shell'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'

export default async function HomeStub({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'meta' })
  return (
    <PageShell locale={locale as Locale} alternates={localizedPaths('/')}>
      <div className="p-10">
        <h1 className="text-4xl">{t('defaultTitle')}</h1>
      </div>
    </PageShell>
  )
}
