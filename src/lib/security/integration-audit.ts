import type { PayloadRequest } from 'payload'

// Audit trail for integration (API-key) users (S11): who did what to which contact, never the values.
// Only ids, the user's email, the operation and the NAMES of the touched fields are logged (no contact PII).

const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt'])

/** Names of the top-level fields whose value differs between two docs (all present fields when there is no baseline). */
export function changedFieldNames(before: Record<string, unknown> | undefined, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter(
    (key) => !SYSTEM_FIELDS.has(key) && (!before || JSON.stringify(before[key]) !== JSON.stringify(after[key])),
  )
}

export type IntegrationAction = {
  /** Event suffix; the logged name is `integration_<event>`. */
  event: string
  operation: string
  contactId: number | string
  fields: string[]
}

/** One structured info line when the request user has role `integration`; a no-op for anybody else. */
export function logIntegrationAction(req: PayloadRequest, action: IntegrationAction): void {
  const user = req.user as { id?: number | string; email?: string; role?: unknown } | null | undefined
  if (user?.role !== 'integration') return
  req.payload.logger.info({
    event: `integration_${action.event}`,
    userId: user.id,
    userEmail: user.email,
    operation: action.operation,
    contactId: action.contactId,
    fields: action.fields,
  })
}
