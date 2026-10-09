# CoffeeProjects Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task lives in its own file under `docs/plan/` and is self-contained; read this index first, then the task file, then the spec sections it references.

**Goal:** Build the new trilingual coffeeprojects.es (public site + private Payload admin panel) and deploy it as a full-fidelity, protected, non-indexed prototype on Vercel (`staging` branch), ready to promote to production.

**Architecture:** One Next.js App Router application with two route groups: `(frontend)` for the localized public site (next-intl, `/` = ES, `/en`, `/fr`) and `(payload)` for the Payload CMS admin at `/admin`. Content lives in Postgres (Neon) through Payload's Local API, cached with `unstable_cache` tags and revalidated by Payload hooks. Contact submissions go through a Server Action into a Payload `contacts` collection, trigger Resend emails and a consent-gated Meta Conversions API `Lead` event.

**Tech Stack:** Next.js (version pinned by `create-payload-app`), React 19, TypeScript strict, Payload CMS 3.x, `@payloadcms/db-postgres`, `@payloadcms/storage-vercel-blob`, `@payloadcms/email-resend`, next-intl 4, Tailwind CSS 4, GSAP 3 (+ScrollTrigger, SplitText) + `@gsap/react`, Lenis, three + @react-three/fiber + @react-three/drei, Zod, Vitest, Playwright, @axe-core/playwright, @lhci/cli, pnpm.

**Spec:** `docs/01-design-spec.md` (design) and `docs/02-content-es.md` (source copy). Executors read both before any task.

---

## Global Constraints

- Package manager: **pnpm**. Node.js **≥ 20.9** (Next.js 16 minimum). Never mix npm/yarn lockfiles.
- TypeScript `strict: true`. No `any` in app code (tests may cast).
- Locales exactly: `es` (default, no URL prefix), `en`, `fr`. Adding a locale must only require editing `src/i18n/locales.ts` + a new `messages/<locale>.json`.
- All user-visible strings come from `messages/*.json` (UI) or Payload localized fields (content). No hard-coded copy in components.
- Code, identifiers, comments, commit messages: **English**. Site copy: from `docs/02-content-es.md` (ES) and its translations in `docs/plan/T05-seed.md`.
- **Only real facts in copy.** No invented clients, testimonials, stats or awards. No stat may render as `0`, `—` or empty.
- Brand tokens copied verbatim from spec §6: `--bg-0 #0B0706`, `--bg-1 #120C09`, `--bg-2 #1A1310`, `--bg-3 #241812`, `--amber #F5A742`, `--amber-hi #FFC165`, `--amber-deep #C7782A`, `--crema #FFE8B5`, `--latte #C7A17A`, `--mint #6EE7B7`, `--ink-0 #FFF7E8`, `--ink-1 #E8DCC8`, `--ink-2 #A89584`, `--ink-3 #6B5D4F`.
- Performance: Lighthouse mobile ≥ 95 in Performance, Accessibility, Best Practices, SEO. LCP < 2.5 s, INP < 200 ms, CLS < 0.1. Initial-route JS < 200 KB gzipped excluding the lazy 3D chunk.
- `prefers-reduced-motion: reduce` disables 3D, scroll pinning, smooth scroll and counters (render final values).
- Meta Pixel never fires before marketing consent. CAPI `Lead` only when the submitted form carries `marketingConsent = true`.
- Staging (`NEXT_PUBLIC_SITE_ENV=staging`) must emit `X-Robots-Tag: noindex, nofollow` on every response and `robots.txt` `Disallow: /`.
- `revalidateTag(tag, 'max')` — the two-argument form is mandatory in Next.js 16.
- Next.js 16 uses `src/proxy.ts` (not `middleware.ts`) for next-intl.
- Commits: Conventional Commits, no AI attribution lines (user rule). Work on branch `staging`; `main` is production.

## Review Focus

1. **Language switch on a localized-slug page** (e.g. `/servicios/tiendas-online` → EN) must land on `/en/services/online-stores`, never on a 404 or the EN home. → test in T03 (unit) and T17 (E2E).
2. **Contact form submitted twice / spam burst from the same IP** must create at most 5 contacts per hour per IP and show a friendly localized error, never a 500. → test in T11.
3. **CMS content missing a translation** (e.g. new service filled only in ES) must render the ES fallback, not empty headings. → test in T04 (`fallback: true`) and T06 (data helper unit test).
4. **GitHub API down or rate-limited** must render manual fallback stats from the panel, never `—`/`0`. → test in T09.
5. **User rejects cookies, then submits the form** must store the contact and send emails but send **no** Pixel/CAPI event. → test in T12.

---

## Task index

| ID | File | Deliverable | Spec refs |
|----|------|-------------|-----------|
| T00 | `docs/plan/T00-accounts.md` | External accounts and secrets ready (human actions) | §3, §13 |
| T01 | `docs/plan/T01-scaffold.md` | Next.js + Payload repo, tooling, CI skeleton, `staging` branch | §3, §11 |
| T02 | `docs/plan/T02-design-system.md` | Tokens, fonts, Tailwind theme, UI primitives | §6 |
| T03 | `docs/plan/T03-i18n.md` | next-intl routing with localized pathnames, messages ES/EN/FR, language switcher | §4, G5 |
| T04 | `docs/plan/T04-cms-model.md` | Payload collections, globals, access control, localization | §5 |
| T05 | `docs/plan/T05-seed.md` | Idempotent seed with all content in ES/EN/FR | §5, content doc |
| T06 | `docs/plan/T06-data-layer.md` | Cached CMS queries + revalidation hooks + draft preview | §5, §9 |
| T07 | `docs/plan/T07-shell.md` | Root layout, header, footer, mobile CTA bar, cookie consent | §7, §8 |
| T08 | `docs/plan/T08-home-services.md` | Home page sections + services index + service landings | §4, §7, §8 |
| T09 | `docs/plan/T09-team.md` | Team page, member profiles, GitHub stats with fallback | §4, §9 |
| T10 | `docs/plan/T10-projects.md` | Projects index + detail | §4 |
| T11 | `docs/plan/T11-contact.md` | Contact form, Server Action, Turnstile, rate limit, Resend, thanks page | §8, §9 |
| T12 | `docs/plan/T12-meta-ads.md` | Meta Pixel + CAPI + attribution capture | §8 |
| T13 | `docs/plan/T13-seo.md` | Metadata, hreflang, sitemap, robots, JSON-LD, OG images | §10 |
| T14 | `docs/plan/T14-motion-3d.md` | Lenis, GSAP effects, hero 3D scene, view transitions | §6 |
| T15 | `docs/plan/T15-legal-404-security.md` | Legal pages, 404, security headers | §12 |
| T16 | `docs/plan/T16-admin-ux.md` | Admin branding, contacts inbox UX, roles | §5, G6 |
| T17 | `docs/plan/T17-e2e-quality.md` | Playwright E2E, axe, Lighthouse CI, GitHub Actions | §11 |
| T18 | `docs/plan/T18-staging-deploy.md` | Vercel staging deploy + team validation checklist | §13, G7 |

Order is strict: each task consumes interfaces produced by earlier ones (listed in every task's **Interfaces** block).

## Shared file map (final structure)

```
.
├─ docs/                         # spec, content, plan (this folder)
├─ messages/{es,en,fr}.json      # UI strings (T03)
├─ public/                       # static assets, fallback hero poster (T14)
├─ src/
│  ├─ app/
│  │  ├─ (frontend)/[locale]/    # public pages (T07–T15)
│  │  ├─ (frontend)/next/preview/route.ts  # draft mode (T06)
│  │  ├─ (payload)/              # Payload admin + REST (T01, generated)
│  │  ├─ robots.ts sitemap.ts    # (T13)
│  ├─ collections/               # Payload collections (T04)
│  ├─ globals/                   # Payload globals (T04)
│  ├─ access/                    # access functions (T04)
│  ├─ hooks/                     # revalidation hooks (T06)
│  ├─ components/ui/             # primitives (T02)
│  ├─ components/layout/         # header/footer/consent (T07)
│  ├─ components/sections/       # page sections (T08–T10)
│  ├─ components/motion/         # GSAP/Lenis/3D (T14)
│  ├─ components/admin/          # admin branding (T16)
│  ├─ features/contact/          # schema, action, rate limit, emails (T11)
│  ├─ features/tracking/         # consent, pixel, capi, attribution (T07, T12)
│  ├─ features/github/           # stats (T09)
│  ├─ i18n/                      # routing, navigation, request, locales (T03)
│  ├─ lib/cms/                   # cached queries (T06)
│  ├─ lib/seo/                   # metadata + JSON-LD builders (T13)
│  ├─ lib/env.ts                 # typed env (T01)
│  ├─ seed/                      # seed script + data (T05)
│  ├─ proxy.ts                   # next-intl proxy (T03)
│  └─ payload.config.ts
├─ tests/unit/ tests/e2e/        # Vitest + Playwright (all tasks)
├─ vercel.json lighthouserc.json playwright.config.ts vitest.config.mts
```

## Environment variables (`.env.example`, created in T01)

| Name | Scope | Example / note |
|------|-------|----------------|
| `DATABASE_URL` | server | Neon pooled connection string |
| `PAYLOAD_SECRET` | server | 32+ random bytes (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | public | `http://localhost:3000` / staging URL / `https://coffeeprojects.es` |
| `NEXT_PUBLIC_SITE_ENV` | public | `development` \| `staging` \| `production` |
| `BLOB_READ_WRITE_TOKEN` | server | Vercel Blob token |
| `RESEND_API_KEY` | server | Resend key |
| `EMAIL_FROM_ADDRESS` | server | `hola@coffeeprojects.es` (domain verified in Resend; sender name "CoffeeProjects" is set in config) |
| `CONTACT_NOTIFY_EMAIL` | server | `contact@coffeeprojects.es` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public | dev/staging test key `1x00000000000000000000AA` |
| `TURNSTILE_SECRET_KEY` | server | dev/staging test secret `1x0000000000000000000000000000000AA` |
| `IP_HASH_SALT` | server | random string, used to hash IPs for rate limiting |
| `NEXT_PUBLIC_META_PIXEL_ID` | public | from Meta Events Manager (empty = tracking disabled) |
| `META_CAPI_TOKEN` | server | Conversions API access token |
| `META_GRAPH_VERSION` | server | latest Graph API version at implementation time, e.g. `v24.0` — verify in Meta docs |
| `META_TEST_EVENT_CODE` | server | set on dev/staging only |
| `GITHUB_TOKEN` | server | fine-grained, read-only public data (optional, raises rate limit) |
| `PREVIEW_SECRET` | server | random string for draft preview route |

## Definition of done (whole plan)

- All tasks checked, every task committed on `staging`.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e` green locally and in GitHub Actions.
- Lighthouse CI assertions pass on Home, a service landing, Team, Contact in all 3 locales.
- Staging deployed, protected, `noindex` verified, team checklist in T18 signed off by Erik.
