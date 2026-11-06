import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { GlassCard } from '@/components/ui/glass-card'
import { Link } from '@/i18n/navigation'
import type { Media, TeamMember } from '@/payload-types'

export async function TeamCard({ member, headingAs: Heading = 'h3' }: { member: TeamMember; headingAs?: 'h2' | 'h3' }) {
  const t = await getTranslations('common')
  const photo = typeof member.photo === 'object' ? (member.photo as Media | null) : null

  return (
    <Link href={{ pathname: '/team/[slug]', params: { slug: member.slug } }} className="group block h-full" data-reveal>
      <GlassCard className="flex h-full flex-col">
        <div className="flex items-center gap-4">
          {photo?.url ? (
            <Image src={photo.url} alt={photo.alt} width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
          ) : (
            <span aria-hidden className="grid h-[72px] w-[72px] place-items-center rounded-full bg-brand text-3xl font-semibold text-white">
              {member.name.charAt(0)}
            </span>
          )}
          <div>
            <Heading className="text-xl font-semibold">{member.name}</Heading>
            <p className="text-sm text-amber">{member.role}</p>
          </div>
        </div>
        <p className="mt-5 text-ink-2">{member.shortBio}</p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <div className="space-y-2 text-xs text-ink-3">
            <p>
              {member.location}
            </p>
            {member.available && (
              <p className="flex items-center gap-2 text-mint">
                <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-mint motion-reduce:animate-none" /> {t('available')}
              </p>
            )}
          </div>
          <span className="text-sm font-medium text-brand transition-transform group-hover:translate-x-1">{t('viewProfile')} →</span>
        </div>
      </GlassCard>
    </Link>
  )
}
