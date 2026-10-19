# coffeeprojects.es

Trilingual (es / en / fr) website for CoffeeProjects with a team-only admin panel.

## Stack

- **Next.js 16** (App Router, Turbopack, ISR) + **React 19**, **Tailwind CSS 4**, GSAP / Lenis / React Three Fiber for motion and 3D.
- **Payload 3** CMS mounted in the same app at `/admin` (Postgres via `@payloadcms/db-postgres`, Lexical rich text, Vercel Blob for media, Resend for email).
- **next-intl** for routing and UI strings (`messages/*.json`); CMS content is localized in Payload.
- Contact form protected by Cloudflare Turnstile and a per-IP rate limit; Meta Pixel + Conversions API only after marketing consent.
- Tests: Vitest (`tests/unit`), Playwright + axe (`tests/e2e`), Lighthouse CI (`lighthouserc.json`).

## Local development

Requirements: Node `22` (`.nvmrc`), pnpm `12` (`packageManager` in `package.json`), a Postgres database.

1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill it in (at least `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`). Every variable is documented there.
3. Bring the schema up and add content:
   - a database that `next dev` owns: just run `pnpm dev` once (the Drizzle dev schema push runs only under `next dev`), then `pnpm seed`;
   - any other database: `pnpm payload migrate`, then `pnpm seed`. The seed is non-destructive (`SEED_OVERWRITE=1` overwrites seeded documents) and never pushes the schema.
4. `pnpm dev` → <http://localhost:3000> (site) and <http://localhost:3000/admin> (the first user created becomes `admin`).

**Windows:** if `next dev` / `build` / `start` fails with `ERR_SWC_NATIVE_CACHE` (SWC rejects the ACL of `AppData\Local\swc`), point the native binding cache elsewhere for that command, e.g. `SWC_NATIVE_BINDING_CACHE="C:/Users/<you>/.swc-cache" pnpm build`. `next start` needs it too, because the next-intl plugin loads `@swc/core` when reading `next.config.ts`.

Do not point `pnpm dev` at a staging or production database: dev mode pushes the schema and later migrations would refuse to run there.

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js + Payload app |
| `pnpm deploy:build` | Vercel build: preflight check → `payload migrate` → verify every migration applied → `next build` (`scripts/deploy-build.mjs`) |
| `pnpm seed` | Non-destructive content seed (`src/seed`) |
| `pnpm payload <cmd>` | Payload CLI (`migrate`, `migrate:create`, `generate:types`, …) |
| `pnpm typecheck` / `pnpm lint` | TypeScript and ESLint |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright (builds and starts the app when nothing runs on :3000) |
| `pnpm e2e:user` | Local database only: E2E admin user (`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`) and inbox contacts |
| `pnpm lhci` | Lighthouse CI against `pnpm start` |

Schema changes: edit the collections/globals, then `pnpm payload migrate:create <name>` and commit the generated files in `src/migrations`.

## Environment variables

See [`.env.example`](.env.example) for the full list with comments. Staging vs production values are listed in [`docs/plan/T18-staging-deploy.md`](docs/plan/T18-staging-deploy.md).

- `MICROLINK_API_KEY` (optional): Microlink key for the project cover screenshot taken by the admin's «Importar desde la web» action (`src/features/project-import`). Without it the free endpoint `api.microlink.io` is used (about 50 calls a day); with it, `pro.microlink.io` with the `x-api-key` header. Only the project's public URL is sent to Microlink.

## Deploy

Vercel (`vercel.json`: region `fra1`, build command `pnpm deploy:build`), Neon Postgres, Vercel Blob. Branch `staging` is the protected, `noindex` prototype; `main` is production. The full runbook (env vars, first deploy, seeding, smoke checks, production promotion) is [`docs/plan/T18-staging-deploy.md`](docs/plan/T18-staging-deploy.md); the team validation checklist is `docs/04-staging-checklist.md` (created in its Step 8).
