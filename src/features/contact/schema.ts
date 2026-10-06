import { z } from 'zod'
import { budgets, projectTypes, timelines } from './options'

const checkbox = z.preprocess((v) => v === true || v === 'on' || v === 'true', z.boolean())
const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(max, 'tooLong').optional())

export const contactSchema = z.object({
  name: z.string({ message: 'required' }).trim().min(1, 'required').max(100, 'tooLong'),
  email: z.string({ message: 'required' }).trim().email('invalidEmail').max(200, 'tooLong'),
  phone: optionalText(30),
  projectType: z.enum(projectTypes, { message: 'required' }),
  budget: z.preprocess((v) => (v === '' ? undefined : v), z.enum(budgets).optional()),
  timeline: z.preprocess((v) => (v === '' ? undefined : v), z.enum(timelines).optional()),
  message: z.string({ message: 'required' }).trim().min(20, 'tooShort').max(2000, 'tooLong'),
  howFound: optionalText(200),
  nda: checkbox.default(false),
  privacy: checkbox.refine((v) => v === true, 'privacy'),
  marketingConsent: checkbox.default(false),
  locale: z.enum(['es', 'en', 'fr']),
  sourcePath: z.string().max(300).default('/'),
})

export type ContactInput = z.infer<typeof contactSchema>

export function formDataToObject(fd: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  fd.forEach((value, key) => {
    obj[key === 'cf-turnstile-response' ? 'turnstileToken' : key] = typeof value === 'string' ? value : ''
  })
  return obj
}
