# T18 — Staging deploy on Vercel (full-fidelity prototype) + team validation

> Steps marked **[HUMAN]** need account access or remote authorization and are done by the team. Steps marked **[AGENT]** can be done by the implementer locally. An agent must not push, deploy, run commands against the staging/production databases, or touch Vercel/GitHub settings without explicit authorization from Erik for that specific action.

**Files:**
- Create: `vercel.json`, `docs/04-staging-checklist.md`
- Modify: `.env.example` (comment block documenting staging vs production values)

**Interfaces:**
- Consumes: everything from T01–T17.
- Produces: a protected, `noindex` staging URL on the `staging` branch backed by the Neon `staging` branch, and a signed checklist.

- [x] **Step 1 [AGENT]: `vercel.json`** (committed; `pnpm deploy:build` = `node scripts/deploy-build.mjs`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm deploy:build",
  "regions": ["fra1"]
}
```

> `pnpm deploy:build` runs, in order: a preflight check (fails if the database was ever schema-pushed in dev mode, because `payload migrate` would then stop at an interactive prompt and exit 0 without applying anything), `payload migrate` (with `DATABASE_URL_UNPOOLED` when set, else `DATABASE_URL`; no stdin, 20 min limit), a postflight check that every file in `src/migrations` is recorded, and `next build`. Any failure fails the deploy.
>
> The Drizzle dev schema push runs only under `next dev` (`NODE_ENV=development`, `src/lib/db/push.ts`). Builds, `pnpm seed` and other `payload run` scripts never push, so never point `pnpm dev` at a staging/production database.

> `fra1` (Frankfurt) matches a Neon database in `aws-eu-central-1`; create the Neon project in that region in T00 so DB round-trips stay in-region.

- [ ] **Step 2 [HUMAN]: Push the repo**

```bash
git remote add origin <private GitHub repo URL from T00>
git push -u origin main
git push -u origin staging
```

- [ ] **Step 3 [HUMAN]: Import into Vercel**
  - New Project → import the private repo. Framework: Next.js. Root: repo root.
  - Settings → Git → **Production Branch: `main`**.
  - Settings → Domains → add `staging.coffeeprojects.es` and assign it to the **`staging` branch** (optional; the automatic preview URL also works).
  - Settings → Deployment Protection → **Vercel Authentication: Standard Protection** (protects all preview deployments, including `staging`). Invite Diego, Juan, Erik to the Vercel team so they can open it.

- [ ] **Step 4 [HUMAN]: Environment variables** (Vercel → Settings → Environment Variables)

| Variable | Preview (branch `staging` only) | Production |
|----------|-------------------------------|------------|
| `DATABASE_URL` | Neon **staging** branch (pooled) | Neon **main** branch (pooled) |
| `DATABASE_URL_UNPOOLED` | Neon **staging** branch (direct; set by the Neon integration) — used only for migrations | Neon **main** branch (direct) |
| `PAYLOAD_SECRET` | own random value | different random value |
| `NEXT_PUBLIC_SITE_URL` | `https://staging.coffeeprojects.es` (or preview URL) | `https://coffeeprojects.es` |
| `NEXT_PUBLIC_SITE_ENV` | `staging` | `production` |
| `BLOB_READ_WRITE_TOKEN` | staging Blob store | production Blob store |
| `RESEND_API_KEY` / `EMAIL_FROM_ADDRESS` / `CONTACT_NOTIFY_EMAIL` | same key; notify to the team | same |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare test keys | real keys |
| `IP_HASH_SALT`, `PREVIEW_SECRET` | own values | different values |
| `NEXT_PUBLIC_META_PIXEL_ID` / `META_CAPI_TOKEN` / `META_GRAPH_VERSION` | real Pixel + token | real Pixel + token |
| `META_TEST_EVENT_CODE` | **set** (events go to Test Events) | **unset** |
| `GITHUB_TOKEN` | optional | optional |

- [ ] **Step 5 [HUMAN]: First staging deploy**
  - Push to `staging` (or "Redeploy"). The build runs `pnpm deploy:build` (preflight → `payload migrate` → verify → `next build`) against the Neon staging branch.
  - Order: **migrate (inside the build) → seed (Step 6) → redeploy**. The first build runs against an empty database on purpose: pages tolerate empty globals (translated fallbacks; pricing and legal pages 404 until seeded), so it succeeds; the redeploy after seeding prerenders the real content.
  - Open `https://staging.coffeeprojects.es/admin` → **create the first user** (becomes `admin`) → create the other team accounts as `editor` or `admin`.

- [ ] **Step 6 [HUMAN, or AGENT with explicit authorization]: Seed staging content**

```bash
DATABASE_URL="<neon staging pooled url>" PAYLOAD_SECRET="<staging secret>" NEXT_PUBLIC_SITE_URL="https://staging.coffeeprojects.es" NEXT_PUBLIC_SITE_ENV=staging pnpm seed
```

The seed never pushes the schema (no `NODE_ENV=development`), so it only works on a database that `payload migrate` already brought up to date (Step 5). It is non-destructive: existing content is kept unless `SEED_OVERWRITE=1` is set (which overwrites every seeded document).

Then trigger a redeploy (or publish any doc in the admin) so ISR pages pick up the content.

- [ ] **Step 7 [AGENT/HUMAN]: Automated smoke against staging**

Vercel Authentication blocks anonymous requests; create a **Protection Bypass for Automation** secret in Vercel (Deployment Protection settings) and run:

```bash
E2E_BASE_URL=https://staging.coffeeprojects.es pnpm exec playwright test tests/e2e/navigation.spec.ts tests/e2e/consent.spec.ts --project=desktop
```

with `extraHTTPHeaders: { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_SECRET }` added to `playwright.config.ts` `use` when `E2E_BASE_URL` is set.

Checks that must hold on staging:

```bash
curl -sI -H "x-vercel-protection-bypass: $VERCEL_BYPASS_SECRET" https://staging.coffeeprojects.es/ | grep -i x-robots-tag   # noindex, nofollow
curl -s  -H "x-vercel-protection-bypass: $VERCEL_BYPASS_SECRET" https://staging.coffeeprojects.es/robots.txt                # Disallow: /
```

- [ ] **Step 8 [AGENT]: Write `docs/04-staging-checklist.md`** with this exact content, for the team to tick on staging:

```markdown
# Staging validation checklist — coffeeProjects

Reviewer: ______  Date: ______  Device(s): ______

## Look & feel
- [ ] Home hero 3D scene loads on desktop and on a recent phone; static cup on low-end/reduced motion
- [ ] Animations feel smooth (no jank on scroll), nothing flashes or jumps on load
- [ ] Brand looks premium and consistent (colors, fonts, spacing) on mobile, tablet and desktop
- [ ] No placeholder, "0" or "—" visible anywhere (stats, GitHub, prices)

## Content (ES / EN / FR)
- [ ] Every page reviewed in Spanish
- [ ] Every page reviewed in English
- [ ] Every page reviewed in French
- [ ] Language switcher keeps the same page in all three languages
- [ ] Team bios (Erik, Diego, Juan) approved by each person
- [ ] Prices and timelines confirmed (Q10 online stores)

## Conversion
- [ ] Every service landing has a working "Pide tu presupuesto" with the right project type preselected
- [ ] Contact form: errors are clear, success page shows, team email received, client auto-reply received in the right language
- [ ] Contact appears in /admin inbox with status "new" and campaign (UTM) when consent was accepted
- [ ] Meta Test Events shows PageView, ViewContent and Lead (browser + server, deduplicated) after accepting cookies
- [ ] Rejecting cookies → no Meta events

## Panel (/admin)
- [ ] All team members can log in
- [ ] Edit a service in ES, EN and FR → publish → change visible on the site
- [ ] Preview of a draft works
- [ ] Add a project with an image → appears in the portfolio
- [ ] Change a contact status and add internal notes

## Technical
- [ ] Lighthouse mobile ≥ 95 in all 4 categories on Home, one service, Team, Contact (run on production-like env)
- [ ] Staging is not indexable (X-Robots-Tag noindex, robots.txt Disallow)
- [ ] CI green on the `staging` branch

## Before production (blocking)
- [ ] Legal data filled in (Q3) and "companyComplete" ticked in /admin → Legal
- [ ] Vercel Pro plan active (Q7)
- [ ] Production env vars set (real Turnstile keys, no META_TEST_EVENT_CODE)
- [ ] Production database seeded/content copied and reviewed

Approved for production by Erik: ______
```

- [ ] **Step 9 [AGENT]: Commit**

```bash
git add vercel.json docs/04-staging-checklist.md .env.example
git commit -m "chore(deploy): add Vercel config and staging validation checklist"
```

- [ ] **Step 10 [HUMAN]: Team validation** — the team walks the checklist on staging. Every requested change goes back to Erik → logged in the ODD feature document → fixed on `staging` → re-checked.

## Production promotion (out of scope for this plan; done only after Erik signs the checklist)

1. Open a PR `staging` → `main`; CI must be green.
2. Merge → Vercel production deploy runs migrations on the Neon `main` branch.
3. Seed or migrate content to production; create admin users.
4. Point `coffeeprojects.es` DNS to Vercel; verify HTTPS.
5. Google Search Console + Bing Webmaster: verify domain, submit `https://coffeeprojects.es/sitemap.xml`.
6. Meta Events Manager: verify the domain, confirm live events (no test code).
