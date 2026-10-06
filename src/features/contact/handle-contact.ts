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

export async function handleContact(raw: Record<string, unknown>, deps: ContactDeps): Promise<ContactResult> {
  const eventId = deps.newEventId()

  // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') return { status: 'ok', saved: false, eventId }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactInput
      fieldErrors[key] ??= issue.message
    }
    return { status: 'error', fieldErrors }
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
