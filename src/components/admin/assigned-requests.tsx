import type { Payload, TypedUser } from 'payload'
import type { ContactStatus } from '@/features/contact/options'
import { contactStatusLabels } from '@/fields/labels'
import { statusColors } from './status-cell'

/** S20: requests still waiting on their assignee. `answered` and `archived` are closed. */
export const OPEN_STATUSES = ['new', 'in-progress'] as const satisfies readonly ContactStatus[]
export const ASSIGNED_LIMIT = 8

type Props = {
  payload: Payload
  user?: TypedUser | null
  i18n?: { language?: string }
}

const isEs = (language = 'es') => language.startsWith('es')

/** Contacts list filtered by assignedTo = me and the open statuses (the list filter UI's where[or][and] shape). */
export function assignedListHref(userId: number | string, adminRoute = '/admin') {
  const base = `where[or][0][and]`
  const query = [
    `${base}[0][assignedTo][equals]=${encodeURIComponent(String(userId))}`,
    ...OPEN_STATUSES.map((s, i) => `${base}[1][status][in][${i}]=${s}`),
  ].join('&')
  return `${adminRoute}/collections/contacts?${query}`
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "hace 3 días" / "3 days ago"; under a minute, "ahora" / "now". */
export function relativeAge(iso: string, now: Date, language = 'es') {
  const rtf = new Intl.RelativeTimeFormat(isEs(language) ? 'es' : 'en', { numeric: 'auto' })
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(0, 'second')
}

export function assignedCopy(count: number, language = 'es') {
  if (isEs(language)) {
    return {
      title: 'Mis solicitudes abiertas',
      count: count === 1 ? '1 abierta' : `${count} abiertas`,
      empty: 'No tienes solicitudes asignadas pendientes.',
      all: 'Ver todas →',
    }
  }
  return {
    title: 'My open requests',
    count: `${count} open`,
    empty: 'No requests assigned to you.',
    all: 'View all →',
  }
}

type Row = { id: number | string; name?: string | null; status?: string | null; createdAt: string }

/**
 * Server Component after the admin nav links (S20): the logged-in user's open requests, oldest first.
 * Runs with the user's own access; any failure renders nothing rather than breaking the admin.
 */
export async function AssignedRequests({ payload, user, i18n }: Props) {
  if (!user) return null
  const language = i18n?.language ?? 'es'
  let docs: Row[]
  let totalDocs: number
  try {
    const res = await payload.find({
      collection: 'contacts',
      where: { and: [{ assignedTo: { equals: user.id } }, { status: { in: [...OPEN_STATUSES] } }] },
      sort: 'createdAt',
      limit: ASSIGNED_LIMIT,
      depth: 0,
      select: { name: true, status: true, createdAt: true },
      user,
      overrideAccess: false,
    })
    docs = res.docs as Row[]
    totalDocs = res.totalDocs
  } catch {
    return null
  }

  const adminRoute = payload.config.routes.admin
  const copy = assignedCopy(totalDocs, language)
  const now = new Date()
  const lang = isEs(language) ? 'es' : 'en'
  return (
    <nav
      aria-label={copy.title}
      data-testid="assigned-requests"
      style={{ margin: '24px 0 0', paddingTop: 16, borderTop: '1px solid var(--theme-elevation-100)', fontSize: 13 }}
    >
      <p style={{ margin: '0 0 8px', display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 600 }}>
        <span>{copy.title}</span>
        <span style={{ color: 'var(--cp-accent)' }}>{copy.count}</span>
      </p>
      {docs.length === 0 ? (
        <p style={{ margin: 0, opacity: 0.7 }}>{copy.empty}</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {docs.map((d) => {
            const status = d.status ?? 'new'
            return (
              <li key={d.id}>
                <a
                  href={`${adminRoute}/collections/contacts/${d.id}`}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit', lineHeight: 1.35 }}
                >
                  <span style={{ display: 'block', fontWeight: 500 }}>{d.name || `#${d.id}`}</span>
                  <span style={{ display: 'block', fontSize: 12, opacity: 0.75 }}>
                    <span style={{ color: statusColors[status] ?? 'inherit' }}>{contactStatusLabels[status]?.[lang] ?? status}</span>
                    {' · '}
                    <time dateTime={d.createdAt}>{relativeAge(d.createdAt, now, language)}</time>
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      )}
      <a href={assignedListHref(user.id, adminRoute)} style={{ display: 'inline-block', marginTop: 10, color: 'var(--cp-accent)' }}>
        {copy.all}
      </a>
    </nav>
  )
}
