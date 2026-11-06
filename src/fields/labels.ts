// Admin-panel strings are bilingual: Payload picks the entry matching the user's admin language.
export type Bilingual = { es: string; en: string }

export const t = (es: string, en: string): Bilingual => ({ es, en })

export const adminGroups = {
  content: t('Contenido', 'Content'),
  inbox: t('Bandeja de entrada', 'Inbox'),
  team: t('Equipo', 'Team'),
  settings: t('Ajustes', 'Settings'),
} as const

export const projectTypeLabels: Record<string, Bilingual> = {
  web: t('Web nueva', 'New website'),
  redesign: t('Mejorar su web actual', 'Improve current website'),
  audit: t('Revisión gratuita', 'Free website review'),
  ecommerce: t('Tienda online', 'E-commerce'),
  'fivem-script': t('Script de FiveM', 'FiveM script'),
  'fivem-server': t('Servidor de FiveM', 'FiveM server'),
  'discord-bot': t('Bot de Discord', 'Discord bot'),
  maintenance: t('Mantenimiento', 'Maintenance'),
  custom: t('A medida', 'Custom'),
}

export const websiteIssueLabels: Record<string, Bilingual> = {
  slow: t('Es lenta', 'It is slow'),
  mobile: t('Se ve mal en el móvil', 'Looks bad on mobile'),
  google: t('No sale en Google', 'Not found on Google'),
  outdated: t('Diseño anticuado', 'Outdated design'),
  editing: t('No puede editarla', 'Cannot edit it'),
  'no-leads': t('No le trae clientes', 'Brings no customers'),
  other: t('Otro', 'Other'),
}

export const budgetLabels: Record<string, Bilingual> = {
  lt500: t('Menos de 500 €', 'Under €500'),
  '500-1500': t('500 – 1.500 €', '€500 – 1,500'),
  '1500-3000': t('1.500 – 3.000 €', '€1,500 – 3,000'),
  '3000-6000': t('3.000 – 6.000 €', '€3,000 – 6,000'),
  gt6000: t('Más de 6.000 €', 'Over €6,000'),
  tbd: t('Por definir', 'To be defined'),
}

export const timelineLabels: Record<string, Bilingual> = {
  flexible: t('Flexible', 'Flexible'),
  lt1m: t('Menos de 1 mes', 'Under 1 month'),
  '1-2m': t('1–2 meses', '1–2 months'),
  '2-4m': t('2–4 meses', '2–4 months'),
  gt4m: t('Más de 4 meses', 'Over 4 months'),
}

export const contactStatusLabels: Record<string, Bilingual> = {
  new: t('Nueva', 'New'),
  'in-progress': t('En curso', 'In progress'),
  answered: t('Respondida', 'Answered'),
  archived: t('Archivada', 'Archived'),
}

export const localeLabels: Record<string, Bilingual> = {
  es: t('Español', 'Spanish'),
  en: t('Inglés', 'English'),
  fr: t('Francés', 'French'),
}

export const serviceIconLabels: Record<string, Bilingual> = {
  globe: t('Globo', 'Globe'),
  refresh: t('Renovar', 'Refresh'),
  'shopping-cart': t('Carrito de la compra', 'Shopping cart'),
  code: t('Código', 'Code'),
  server: t('Servidor', 'Server'),
  bot: t('Bot', 'Bot'),
  wrench: t('Llave inglesa', 'Wrench'),
  sparkles: t('Destellos', 'Sparkles'),
}

export const socialNetworkLabels: Record<string, Bilingual> = {
  github: t('GitHub', 'GitHub'),
  linkedin: t('LinkedIn', 'LinkedIn'),
  twitch: t('Twitch', 'Twitch'),
  x: t('X', 'X'),
  instagram: t('Instagram', 'Instagram'),
  website: t('Sitio web', 'Website'),
  email: t('Correo electrónico', 'Email'),
}

export const bilingualOptions = (values: readonly string[], labels: Record<string, Bilingual>) =>
  values.map((value) => ({ label: labels[value] ?? t(value, value), value }))
