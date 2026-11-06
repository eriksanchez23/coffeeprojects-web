// Order = order in the contact form's "other project" list and in the admin; the website lines come first.
export const projectTypes = ['web', 'redesign', 'audit', 'ecommerce', 'maintenance', 'custom', 'discord-bot', 'fivem-script', 'fivem-server'] as const
/** Types that are about a website the visitor already has: they ask for its URL. */
export const existingSiteTypes = ['redesign', 'audit'] as const
/** "What fails on your website?" checkboxes of the redesign path. */
export const websiteIssues = ['slow', 'mobile', 'google', 'outdated', 'editing', 'no-leads', 'other'] as const
export const budgets = ['lt500', '500-1500', '1500-3000', '3000-6000', 'gt6000', 'tbd'] as const
export const timelines = ['flexible', 'lt1m', '1-2m', '2-4m', 'gt4m'] as const
export const contactStatuses = ['new', 'in-progress', 'answered', 'archived'] as const

export type ProjectType = (typeof projectTypes)[number]
export type WebsiteIssue = (typeof websiteIssues)[number]
export type Budget = (typeof budgets)[number]
export type Timeline = (typeof timelines)[number]
export type ContactStatus = (typeof contactStatuses)[number]

export const isExistingSiteType = (t: string): boolean => (existingSiteTypes as readonly string[]).includes(t)

export const toOptions = (values: readonly string[]) => values.map((value) => ({ label: value, value }))
