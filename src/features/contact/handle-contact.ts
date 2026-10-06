import { type ContactInput, contactSchema } from './schema'

export type ContactResult =
  | { status: 'ok'; saved: boolean; eventId: string }
  | { status: 'error'; fieldErrors?: Partial<Record<keyof ContactInput, string>>; formError?: 'captcha' | 'rateLimited' | 'generic' }

export type ContactDeps = {
  verifyCaptcha(token: string): Promise<boolean>
  isRateLimited(): Promise<boolean>
  createContact(data: ContactInput & { ipHash: string }): Promise<void>
  notify(input: ContactInput): Promise<void>
  afterSave?(input: ContactInput, eventId: string): Promise<void>
  newEventId(): string
  ipHash: string
  log(e: unknown): void
}

// Fields the form shows an error for; failures elsewhere need a form-level message.
const RENDERED_FIELDS: ReadonlySet<string> = new Set(['name', 'email', 'phone', 'projectType', 'message', 'howFound', 'nda', 'privacy'])

export async function handleContact(raw: Record<string, unknown>, deps: ContactDeps): Promise<ContactResult> {
  const eventId = deps.newEventId()

  // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
  if (typeof raw.cp_hp === 'string' && raw.cp_hp.trim() !== '') return { status: 'ok', saved: false, eventId }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactInput, string>> = {}
    let hidden = false
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactInput
      if (RENDERED_FIELDS.has(key)) fieldErrors[key] ??= issue.message
      else hidden = true
    }
    return {
      status: 'error',
      ...(Object.keys(fieldErrors).length > 0 && { fieldErrors }),
      ...(hidden && { formError: 'generic' as const }),
    }
  }
  const input = parsed.data

  if (!(await deps.verifyCaptcha(String(raw.turnstileToken ?? '')))) return { status: 'error', formError: 'captcha' }
  if (await deps.isRateLimited()) return { status: 'error', formError: 'rateLimited' }

  try {
    await deps.createContact({ ...input, ipHash: deps.ipHash })
  } catch (e) {
    deps.log(e)
    return { status: 'error', formError: 'generic' }
  }

  // Side effects after a successful save must never turn the submission into an error.
  await Promise.allSettled([deps.notify(input), deps.afterSave?.(input, eventId)]).then((results) =>
    results.forEach((r) => r.status === 'rejected' && deps.log(r.reason)),
  )

  return { status: 'ok', saved: true, eventId }
}
