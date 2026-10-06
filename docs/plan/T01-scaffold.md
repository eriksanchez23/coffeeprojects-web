# T01 — Scaffold: Next.js + Payload repo, tooling, CI skeleton

**Files:**
- Create (generated): whole Payload blank template at repo root (`src/app/(frontend)`, `src/app/(payload)`, `src/collections/Users.ts`, `src/collections/Media.ts`, `src/payload.config.ts`, `next.config.mjs`, `tsconfig.json`, `package.json`)
- Create: `src/lib/env.ts`, `.env.example`, `vitest.config.mts`, `playwright.config.ts`, `tests/unit/env.test.ts`, `.github/workflows/ci.yml`, `.nvmrc`, `.gitignore` additions
- Modify: `package.json` scripts

**Interfaces:**
- Consumes: env values from T00.
- Produces: `env` object from `src/lib/env.ts` (`env.SITE_URL: string`, `env.SITE_ENV: 'development'|'staging'|'production'`, `env.isStaging: boolean`, `env.isProduction: boolean`); scripts `dev`, `build`, `deploy:build`, `lint`, `typecheck`, `test`, `test:e2e`, `generate:types`, `generate:importmap`, `seed`.

- [ ] **Step 1: Scaffold into a temporary folder and move to repo root**

The repo root is the folder that already contains `docs/`. `create-payload-app` needs an empty target, so scaffold beside it:

```bash
cd ..
pnpm dlx create-payload-app@latest --help   # confirm flag names for the installed version
pnpm dlx create-payload-app@latest --name cp-scaffold --template blank --db postgres --use-pnpm --no-deps
```

If a flag is rejected, run it interactively and choose: template **blank**, database **PostgreSQL**, package manager **pnpm**. Then move everything (including dotfiles) into the repo root and delete the temp folder:

```bash
cp -r cp-scaffold/. Web-CoffeeProjects/
rm -rf cp-scaffold
cd Web-CoffeeProjects
pnpm install
```

- [ ] **Step 2: Init git on `staging`**

```bash
git init -b main
git add -A && git commit -m "chore: scaffold Next.js + Payload blank template"
git checkout -b staging
```

- [ ] **Step 3: Add dependencies used across the plan**

```bash
pnpm add zod next-intl @payloadcms/storage-vercel-blob @payloadcms/email-resend
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths @playwright/test @axe-core/playwright @lhci/cli prettier
pnpm exec playwright install chromium
```

Check that `@payloadcms/*` packages all resolve to the **same version** as `payload` in `package.json`; if not, pin them to that exact version.

- [ ] **Step 4: Write the failing env test**

`tests/unit/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/lib/env'

const base = {
  NEXT_PUBLIC_SITE_URL: 'https://coffeeprojects.es',
  NEXT_PUBLIC_SITE_ENV: 'production',
}

describe('parseEnv', () => {
  it('derives flags from SITE_ENV', () => {
    const env = parseEnv(base)
    expect(env.isProduction).toBe(true)
    expect(env.isStaging).toBe(false)
    expect(env.SITE_URL).toBe('https://coffeeprojects.es')
  })

  it('strips a trailing slash from SITE_URL', () => {
    expect(parseEnv({ ...base, NEXT_PUBLIC_SITE_URL: 'https://x.dev/' }).SITE_URL).toBe('https://x.dev')
  })

  it('defaults SITE_ENV to development', () => {
    const env = parseEnv({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })
    expect(env.SITE_ENV).toBe('development')
  })

  it('rejects an invalid SITE_ENV', () => {
    expect(() => parseEnv({ ...base, NEXT_PUBLIC_SITE_ENV: 'prod' })).toThrow()
  })
})
```

`vitest.config.mts`:

```ts
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    // Defaults so modules that parse env at import time (src/lib/env.ts) load under test.
    env: { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', NEXT_PUBLIC_SITE_ENV: 'development' },
  },
})
```

Ensure `tsconfig.json` has `"paths": { "@/*": ["./src/*"], "@payload-config": ["./src/payload.config.ts"] }` (the template already sets `@payload-config`; add `@/*` if missing).

- [ ] **Step 5: Run it — expect FAIL** (`Cannot find module '@/lib/env'`)

```bash
pnpm vitest run tests/unit/env.test.ts
```

- [ ] **Step 6: Implement `src/lib/env.ts`**

```ts
import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
})

export type Env = {
  SITE_URL: string
  SITE_ENV: 'development' | 'staging' | 'production'
  isStaging: boolean
  isProduction: boolean
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = schema.parse(source)
  const SITE_ENV = parsed.NEXT_PUBLIC_SITE_ENV
  return {
    SITE_URL: parsed.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''),
    SITE_ENV,
    isStaging: SITE_ENV === 'staging',
    isProduction: SITE_ENV === 'production',
  }
}

// NEXT_PUBLIC_* must be referenced literally so Next.js inlines them in client bundles.
export const env = parseEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV,
})
```

- [ ] **Step 7: Run it — expect PASS**

```bash
pnpm vitest run tests/unit/env.test.ts
```

- [ ] **Step 8: Scripts, env example, node version**

Merge into `package.json` `scripts` (keep the template's `payload` script):

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "deploy:build": "payload migrate && next build",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "generate:types": "payload generate:types",
  "generate:importmap": "payload generate:importmap",
  "seed": "payload run src/seed/index.ts",
  "format": "prettier --write ."
}
```

`.nvmrc`: `22`

Create `.env.example` with every variable from the env table in `docs/03-implementation-plan.md` (names only, test values for Turnstile, empty otherwise). Ensure `.gitignore` contains `.env*` and `!.env.example`, `/test-results`, `/playwright-report`, `/.lighthouseci`.

- [ ] **Step 9: Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'pnpm build && pnpm start', url: baseURL, timeout: 300_000, reuseExistingServer: true },
})
```

- [ ] **Step 10: CI skeleton** — `.github/workflows/ci.yml`:

```yaml
name: ci
on:
  push: { branches: [staging, main] }
  pull_request:
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
```

(E2E + Lighthouse jobs are added in T17.)

- [ ] **Step 11: Verify the app boots**

```bash
pnpm typecheck && pnpm test
pnpm dev   # open http://localhost:3000/admin → create first user (Erik, role admin after T04) → stop server
```

Expected: typecheck/test green; admin "Create first user" screen renders; DB tables created in the Neon `dev` branch.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: add tooling, typed env, test runners and CI skeleton"
```
