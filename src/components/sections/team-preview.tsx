import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/ui/section'
import type { Locale } from '@/i18n/locales'
import { getTeam } from '@/lib/cms/queries'
import { TeamCard } from './team-card'

export async function TeamGrid({ locale, headingAs }: { locale: Locale; headingAs?: 'h2' | 'h3' }) {
  const team = await getTeam(locale)
  return (
    <ul className="grid gap-4 lg:grid-cols-3" data-reveal-group>
      {team.map((m) => (
        <li key={m.id}>
          <TeamCard member={m} headingAs={headingAs} />
        </li>
      ))}
    </ul>
  )
}

export async function TeamPreview({ locale, title, lead }: { locale: Locale; title: string; lead?: string | null }) {
  const ts = await getTranslations('sections')
  return (
    <Section id="team" eyebrow={ts('team')} title={title} lead={lead}>
      <TeamGrid locale={locale} />
    </Section>
  )
}
