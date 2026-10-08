import { resolvePlan } from './plan'
import { type ContactInput, contactSchema } from './schema'

export type ContactResult =
  | { status: 'ok'; saved: boolean; eventId: string }
  | { status: 'error'; fieldErrors?: Partial<Record<keyof ContactInput, string>>; formError?: 'captcha' | 'rateLimited' | 'generic' }

/** A validated submission plus the quote summary rebuilt server-side (S17). */
export type ContactLead = ContactInput & { quotedSummary?: string }

export type ContactDeps = {
  verifyCaptcha(token: string): Promise<boolean>
  isRateLimited(): Promise<boolean>
  createContact(data: ContactLead & { ipHash: string }): Promise<void>
  notify(input: ContactLead): Promise<void>
  afterSave?(input: ContactInput, eventId: string): Promise<void>
  /** Package slugs currently published in the pricing global; a submitted plan outside this list is dropped. */
  knownPlans?(): Promise<string[]>
  /** The price/time summary the form showed for this project type and plan, built from the CMS (never from the client). */
  quoteSummary?(input: ContactInput): Promise<string | undefined>
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
  if (!(await deps.verifyCaptcha(String(raw.turnstileToken ?? '')))) return { status: 'error', formError: 'captcha' }
  if (await deps.isRateLimited()) return { status: 'error', formError: 'rateLimited' }

  // Looked up only for verified, non-limited submissions, so bots never cost a CMS read.
  const validated = { ...parsed.data, plan: await knownPlan(parsed.data.plan, deps) }
  const input: ContactLead = { ...validated, quotedSummary: await quoteSummary(validated, deps) }

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

async function knownPlan(plan: string | undefined, deps: ContactDeps): Promise<string | undefined> {
  if (!plan || !deps.knownPlans) return undefined
  try {
    return resolvePlan(plan, await deps.knownPlans())
  } catch (e) {
    // The plan is a nice-to-have: an unreadable pricing global drops it, never the lead.
    deps.log(e)
    return undefined
  }
}

async function quoteSummary(input: ContactInput, deps: ContactDeps): Promise<string | undefined> {
  if (!deps.quoteSummary) return undefined
  try {
    return (await deps.quoteSummary(input))?.slice(0, 500) || undefined
  } catch (e) {
    // Informational only: a CMS hiccup drops the summary, never the lead.
    deps.log(e)
    return undefined
  }
}
