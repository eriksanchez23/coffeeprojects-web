import { z } from 'zod'
import { isExistingSiteType, projectTypes, websiteIssues } from './options'
import { parsePlan } from './plan'

// Single-line fields never legitimately hold control characters (header/log injection, invisible junk).
const stripControl = (v: unknown) => (typeof v === 'string' ? v.replace(/\p{Cc}/gu, '') : v)
const checkbox = z.preprocess((v) => v === true || v === 'on' || v === 'true', z.boolean())
const optionalText = (max: number) =>
  z.preprocess((v) => { const c = stripControl(v); return typeof c === 'string' && c.trim() === '' ? undefined : c }, z.string().trim().max(max, 'tooLong').optional())

/** "tuweb.com" → "https://tuweb.com"; anything that is not an http(s) URL with a dotted host is rejected. */
export function normalizeSiteUrl(v: unknown): unknown {
  const c = stripControl(v)
  if (typeof c !== 'string') return c
  const trimmed = c.trim()
  if (trimmed === '') return undefined
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const u = new URL(withScheme)
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || u.username || u.password) return 'invalid'
    return u.toString()
  } catch {
    return 'invalid'
  }
}

const issuesList = z.preprocess(
  (v) => (Array.isArray(v) ? (v.length > 0 ? v : undefined) : typeof v === 'string' && v !== '' ? v.split(',') : undefined),
  z.array(z.enum(websiteIssues)).max(websiteIssues.length).optional(),
)

export const contactSchema = z.object({
  name: z.preprocess(stripControl, z.string({ message: 'required' }).trim().min(1, 'required').max(100, 'tooLong')),
  email: z.preprocess(stripControl, z.string({ message: 'required' }).trim().email('invalidEmail').max(200, 'tooLong')),
  phone: optionalText(30),
  projectType: z.enum(projectTypes, { message: 'required' }),
  // S17: the form no longer asks for a budget or a timeline; any such field sent is stripped (budget/timeline
  // columns stay in the collection only for older requests).
  // Required (20+ chars) except for the "existing website" paths, where the URL is the essential data.
  message: z.preprocess((v) => (typeof v === 'string' ? v : ''), z.string().trim().max(2000, 'tooLong')),
  currentUrl: z.preprocess(normalizeSiteUrl, z.string().max(300, 'tooLong').refine((v) => v !== 'invalid', 'invalidUrl').optional()),
  websiteIssues: issuesList,
  howFound: optionalText(200),
  // Pricing package from /pricing CTAs; checked against the pricing global in handleContact.
  plan: z.preprocess(parsePlan, z.string().optional()),
  nda: checkbox.default(false),
  privacy: checkbox.refine((v) => v === true, 'privacy'),
  marketingConsent: checkbox.default(false),
  locale: z.enum(['es', 'en', 'fr']),
  sourcePath: z.string().max(300).default('/'),
}).superRefine((d, ctx) => {
  if (isExistingSiteType(d.projectType)) {
    if (!d.currentUrl) ctx.addIssue({ code: 'custom', path: ['currentUrl'], message: 'required' })
  } else if (d.message.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['message'], message: 'required' })
  } else if (d.message.length < 20) {
    ctx.addIssue({ code: 'custom', path: ['message'], message: 'tooShort' })
  }
})

export type ContactInput = z.infer<typeof contactSchema>

export function formDataToObject(fd: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  fd.forEach((value, key) => {
    obj[key === 'cf-turnstile-response' ? 'turnstileToken' : key] = typeof value === 'string' ? value : ''
  })
  // Checkbox group: every checked value, not only the last one.
  const issues = fd.getAll('websiteIssues').filter((v): v is string => typeof v === 'string' && v !== '')
  if (issues.length > 0) obj.websiteIssues = issues
  return obj
}
