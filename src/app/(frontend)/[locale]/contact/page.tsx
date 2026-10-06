import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ContactForm } from '@/components/contact/contact-form'
import { PageShell } from '@/components/layout/page-shell'
import { Container } from '@/components/ui/container'
import { GlassCard } from '@/components/ui/glass-card'
import { projectTypes } from '@/features/contact/options'
import type { Locale } from '@/i18n/locales'
import { localizedPaths } from '@/i18n/paths'
import { getSettings } from '@/lib/cms/queries'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd } from '@/lib/seo/jsonld'
import { absoluteUrl, buildMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'contact' })
  return buildMetadata({ locale, paths: localizedPaths('/contact'), title: t('title'), description: t('lead') })
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const sp = await searchParams
  // R21: the CTA band only ever sends ?type=; personal data never travels in URLs.
  const rawType = Array.isArray(sp.type) ? sp.type[0] : sp.type
  const type = projectTypes.find((p) => p === rawType)
  const [t, tn, settings] = await Promise.all([getTranslations('contact'), getTranslations('nav'), getSettings(locale)])
  const alternates = localizedPaths('/contact')

  return (
    <PageShell locale={locale} alternates={alternates} hideMobileCta>
      <JsonLd
        data={breadcrumbLd([
          { name: tn('home'), url: absoluteUrl(localizedPaths('/')[locale]) },
          { name: tn('contact'), url: absoluteUrl(alternates[locale]) },
        ])}
      />
      <section className="steam-glow pt-20 pb-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">{t('eyebrow')}</p>
            <h1 className="mt-4 text-5xl font-semibold sm:text-6xl">{t('title')}</h1>
            <p className="mt-6 text-lg text-ink-2">{t('lead')}</p>
            <GlassCard className="mt-10 space-y-3 text-sm">
              <a href={`mailto:${settings.contactEmail}`} className="block font-display text-xl text-ink-0 hover:text-amber" data-track="contact-email">
                {settings.contactEmail}
              </a>
              <p className="text-ink-2">{t('replyBy')}</p>
            </GlassCard>
          </div>
          <GlassCard className="p-6 sm:p-10">
            <ContactForm
              locale={locale}
              sourcePath={alternates[locale]}
              prefill={{ type }}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
            />
          </GlassCard>
        </Container>
      </section>
    </PageShell>
  )
}
