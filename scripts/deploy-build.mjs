// `pnpm deploy:build` (Vercel buildCommand, see vercel.json): preflight → migrate → verify → next build.
// Migrations use DATABASE_URL_UNPOOLED when set (Neon's direct connection; DDL through the pooler is
// unreliable) and fall back to DATABASE_URL. The build itself keeps the pooled DATABASE_URL.
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

// Preview-only: DATABASE_NAME_OVERRIDE gives the deployment its own database on the same server (created here
// if missing); the rewritten URLs are used for migrate, seed and build. Runtime does the same swap in
// payload.config.ts (src/lib/db/database-url.ts). Never in production.
const overrideName = process.env.DATABASE_NAME_OVERRIDE
if (overrideName) {
  if (process.env.NEXT_PUBLIC_SITE_ENV === 'production') {
    console.error('[deploy:build] DATABASE_NAME_OVERRIDE is not allowed in production')
    process.exit(1)
  }
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(overrideName)) {
    console.error('[deploy:build] DATABASE_NAME_OVERRIDE must be a plain lowercase database name')
    process.exit(1)
  }
  const swap = (url) => {
    if (!url) return url
    const u = new URL(url)
    u.pathname = `/${overrideName}`
    return u.toString()
  }
  // pg is a dependency of @payloadcms/db-postgres (pnpm keeps it out of the top-level node_modules).
  const require = createRequire(import.meta.url)
  const { Client } = createRequire(require.resolve('@payloadcms/db-postgres'))('pg')
  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL })
  await client.connect()
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [overrideName])
  if (!rowCount) {
    await client.query(`CREATE DATABASE "${overrideName}"`)
    console.log(`[deploy:build] created preview database ${overrideName}`)
  } else console.log(`[deploy:build] using preview database ${overrideName}`)
  await client.end()
  process.env.DATABASE_URL = swap(process.env.DATABASE_URL)
  if (process.env.DATABASE_URL_UNPOOLED) process.env.DATABASE_URL_UNPOOLED = swap(process.env.DATABASE_URL_UNPOOLED)
  // The child processes swap the name again through payload.config; the URL already points at it.
}

const migrateUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!migrateUrl) {
  console.error('[deploy:build] DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set')
  process.exit(1)
}
const migrateEnv = { ...process.env, DATABASE_URL: migrateUrl }

function run(label, command, env) {
  console.log(`\n[deploy:build] ${label}`)
  // No stdin and a time limit: nothing in a deploy may wait for an interactive answer.
  const res = spawnSync(command, { env, shell: true, stdio: ['ignore', 'inherit', 'inherit'], timeout: 20 * 60_000 })
  if (res.status !== 0) {
    console.error(`[deploy:build] ${label} failed (${res.error?.message ?? `exit ${res.status ?? res.signal}`})`)
    process.exit(res.status || 1)
  }
}

// Preflight: on a dev-pushed database migrate would prompt (hang, or exit 0 without applying anything).
run('check database before migrate', 'pnpm payload run scripts/verify-migrations.ts', { ...migrateEnv, MIGRATIONS_PREFLIGHT: '1' })
run('payload migrate', 'pnpm payload migrate', migrateEnv)
// Postflight: every migration file must now be recorded.
run('verify migrations', 'pnpm payload run scripts/verify-migrations.ts', migrateEnv)
// Preview databases start empty: PREVIEW_SEED=1 fills them (the seed never overwrites existing content).
// Where uploads (panel photos, seeded screenshots) go: on Vercel only Blob storage survives the build.
console.log(`[deploy:build] media storage: ${process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob' : 'local disk (MEDIA_DIR)'}`)
if (process.env.PREVIEW_SEED === '1' && process.env.NEXT_PUBLIC_SITE_ENV !== 'production') run('seed preview content', 'pnpm seed', migrateEnv)
run('next build', 'pnpm build', process.env)
