/**
 * Drizzle's dev schema push is only for `next dev` against a throwaway local database. Everything else
 * (`next build`/`start`, `payload run` scripts such as the seed, tests, Vercel) must leave the schema to
 * `payload migrate`: a push against a migrated database records a dev batch (-1) that makes later
 * migrations prompt and exit without applying.
 */
export function shouldPushSchema(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return nodeEnv === 'development'
}
