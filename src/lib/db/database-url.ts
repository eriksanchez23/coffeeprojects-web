/**
 * Preview deployments can run on their own database inside the same Postgres server: DATABASE_NAME_OVERRIDE
 * (set only for a preview branch in Vercel) swaps the database name of DATABASE_URL, so the credentials never
 * have to be copied anywhere. Ignored in production. scripts/deploy-build.mjs mirrors this logic (plain JS).
 */
export const DATABASE_NAME_PATTERN = /^[a-z][a-z0-9_]{0,62}$/

export function resolveDatabaseUrl(
  url: string | undefined,
  { name = process.env.DATABASE_NAME_OVERRIDE, siteEnv = process.env.NEXT_PUBLIC_SITE_ENV } = {},
): string {
  if (!url || !name || siteEnv === 'production') return url ?? ''
  if (!DATABASE_NAME_PATTERN.test(name)) throw new Error('DATABASE_NAME_OVERRIDE must be a plain lowercase database name')
  const u = new URL(url)
  u.pathname = `/${name}`
  return u.toString()
}
