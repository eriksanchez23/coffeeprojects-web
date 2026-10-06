export const projectTypes = ['web', 'ecommerce', 'fivem-script', 'fivem-server', 'discord-bot', 'maintenance', 'custom'] as const
export const budgets = ['lt500', '500-1500', '1500-3000', '3000-6000', 'gt6000', 'tbd'] as const
export const timelines = ['flexible', 'lt1m', '1-2m', '2-4m', 'gt4m'] as const
export const contactStatuses = ['new', 'in-progress', 'answered', 'archived'] as const

export type ProjectType = (typeof projectTypes)[number]
export type Budget = (typeof budgets)[number]
export type Timeline = (typeof timelines)[number]
export type ContactStatus = (typeof contactStatuses)[number]

export const toOptions = (values: readonly string[]) => values.map((value) => ({ label: value, value }))
