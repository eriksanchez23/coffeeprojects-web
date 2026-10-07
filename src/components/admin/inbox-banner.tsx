import type { Payload, TypedUser } from 'payload'

type Props = {
  payload: Payload
  user?: TypedUser | null
  i18n?: { language?: string }
}

export const inboxHref = (adminRoute = '/admin') => `${adminRoute}/collections/contacts?where[status][equals]=new`

export function inboxCopy(count: number, language = 'es') {
  if (language.startsWith('es')) {
    return {
      title: count === 1 ? '1 nueva solicitud de contacto' : `${count} nuevas solicitudes de contacto`,
      cta: 'Abrir bandeja →',
    }
  }
  return {
    title: count === 1 ? '1 new contact request' : `${count} new contact requests`,
    cta: 'Open inbox →',
  }
}

// Server Component: the count runs with the logged-in user's access, never with overrideAccess.
export async function InboxBanner({ payload, user, i18n }: Props) {
  if (!user) return null
  const { totalDocs } = await payload.count({
    collection: 'contacts',
    where: { status: { equals: 'new' } },
    user,
    overrideAccess: false,
  })
  const copy = inboxCopy(totalDocs, i18n?.language)
  return (
    <div
      data-testid="inbox-banner"
      style={{
        margin: '0 0 24px',
        padding: 20,
        borderRadius: 14,
        border: '1px solid rgba(245,167,66,.32)',
        background: 'rgba(245,167,66,.08)',
      }}
    >
      <strong style={{ fontSize: 18 }}>{copy.title}</strong>
      <div style={{ marginTop: 8 }}>
        <a href={inboxHref(payload.config.routes.admin)} style={{ color: '#f5a742' }}>
          {copy.cta}
        </a>
      </div>
    </div>
  )
}
