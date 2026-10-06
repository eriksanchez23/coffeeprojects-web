# coffeeProjects Web — Design Spec

> Status: **DRAFT — pending validation by Erik.** No implementation may start until this spec is approved and `03-implementation-plan.md` exists and is approved.
> Date: 2026-10-06 · Owner: Erik (design & client relations) · Team: Diego, Juan, Erik

---

## 1. Goals

| # | Goal | Success criteria |
|---|------|------------------|
| G1 | Brand-new, premium, attention-grabbing site that makes coffeeProjects look professional and trustworthy | Team sign-off on staging; no "broken" or placeholder data visible anywhere |
| G2 | Win clients: every page leads to a contact action | Visible CTA above the fold and at the end of every page; form completion tracked as conversion |
| G3 | Much stronger SEO | Lighthouse ≥ 95 in all 4 categories on mobile; valid structured data; `hreflang` correct for 3 locales; Core Web Vitals "good" (LCP < 2.5s, INP < 200ms, CLS < 0.1) |
| G4 | Ready for Meta Ads campaigns | Meta Pixel + Conversions API firing `PageView`, `ViewContent`, `Lead` with deduplication, gated by cookie consent |
| G5 | Trilingual: Spanish (source), English, French | Every public string and CMS field available in ES/EN/FR; language switcher keeps the current page |
| G6 | Private team panel | Team logs in at `/admin`, edits content in 3 languages, manages portfolio, reads and triages contact requests |
| G7 | Full-fidelity prototype before production | Same codebase deployed to a protected, non-indexed staging URL on Vercel; team validates there before promoting to production |

### Non-goals (phase 1)
- Custom analytics dashboard (use Meta Ads Manager + Vercel Analytics). Candidate for phase 2.
- More languages than ES/EN/FR (architecture must make adding one a config change, nothing more).
- Client accounts, client login, online payments.
- FiveM script store checkout (the current "Ver tienda" link stays an external link).

---

## 2. Decisions taken (validated in chat)

| Decision | Choice |
|----------|--------|
| Private panel meaning | Admin panel for the team only (option 1) |
| Visual identity | **Evolve** the current coffee + terminal concept to a premium level (no rebrand) |
| Panel scope | Contact inbox + content editing (3 languages) + portfolio management. Metrics → phase 2 |
| Stack | **Next.js (App Router) + Payload CMS** in a single repo, single Vercel deployment |
| Delivery | Private GitHub repo → `staging` branch = full-fidelity prototype on Vercel → `main` = production |

---

## 3. Architecture

```
GitHub (private repo)
 ├─ branch staging ──► Vercel Preview (protected + noindex) ──► Postgres branch "staging" + Blob "staging"
 └─ branch main ─────► Vercel Production (coffeeprojects.es) ─► Postgres branch "main"    + Blob "production"

Next.js app (one deployment)
 ├─ app/(frontend)/[locale]/...   public site (Server Components, ISR)
 ├─ app/(payload)/admin/...       Payload admin panel (team only)
 ├─ app/(payload)/api/...         Payload REST/GraphQL (auth protected)
 └─ app/api/contact               form endpoint → Payload "contacts" + email + Meta CAPI
```

### Stack (use latest stable versions at implementation time — verify with Context7 before pinning)

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js (App Router, React Server Components, TypeScript strict) | SEO-friendly SSR/ISR, native Payload integration |
| CMS / panel | Payload CMS 3.x (runs inside Next.js) | Built-in auth, field-level localization, uploads, admin UI |
| Database | Postgres (Neon via Vercel Marketplace) with `@payloadcms/db-postgres` | Data owned by the team (GDPR), branching for staging |
| Media | Vercel Blob via `@payloadcms/storage-vercel-blob` | Serverless-friendly uploads |
| Email | Resend via `@payloadcms/email-resend` | New-lead notifications + auto-reply to client |
| i18n routing | `next-intl` (`localePrefix: 'as-needed'`) | `/` = ES, `/en`, `/fr`; localized slugs |
| Styling | Tailwind CSS v4 + CSS variables (design tokens) | Speed + consistent tokens |
| Motion | GSAP (+ ScrollTrigger, SplitText — all free now), Lenis smooth scroll | Premium scroll storytelling |
| 3D | Three.js via React Three Fiber + drei, lazy-loaded | Hero scene (see §6) |
| Page transitions | View Transitions API (Next.js experimental `viewTransition`) with graceful fallback | App-like navigation |
| Validation | Zod (shared client/server) | Form safety |
| Anti-spam | Cloudflare Turnstile + honeypot + rate limit | Protect inbox without hurting UX |
| Analytics | Vercel Analytics + Speed Insights | Free, privacy-friendly |
| Ads | Meta Pixel + Meta Conversions API | See §8 |
| Testing | Vitest (unit), Playwright (E2E + visual), Lighthouse CI | See §11 |

### Hosting note (must read)
Vercel **Hobby plan is for non-commercial use only**. A company site that sells services needs **Vercel Pro**. Budget for it before production (staging can be validated on whichever plan the team already has, but production must comply).

---

## 4. Sitemap & routes

Spanish is default and lives at the root to keep current indexed URLs. EN/FR prefixed. Slugs are localized.

| Page | ES | EN | FR | Purpose |
|------|----|----|----|---------|
| Home | `/` | `/en` | `/fr` | Storytelling + all CTAs |
| Services index | `/servicios` | `/en/services` | `/fr/services` | Overview |
| Service landing ×7 | `/servicios/[slug]` | `/en/services/[slug]` | `/fr/services/[slug]` | **Meta Ads landing pages**, one per service |
| Team | `/equipo` | `/en/team` | `/fr/equipe` | 3 profiles, trust |
| Member profile ×3 | `/equipo/[slug]` | `/en/team/[slug]` | `/fr/equipe/[slug]` | `Person` schema, GitHub stats |
| Projects | `/proyectos` | `/en/projects` | `/fr/projets` | Portfolio |
| Project detail | `/proyectos/[slug]` | `/en/projects/[slug]` | `/fr/projets/[slug]` | Case study |
| Contact | `/contacto` | `/en/contact` | `/fr/contact` | Full form |
| Thank you | `/contacto/gracias` | `/en/contact/thanks` | `/fr/contact/merci` | Conversion confirmation page (`noindex`) |
| Legal ×3 | `/aviso-legal`, `/privacidad`, `/cookies` | localized | localized | LSSI-CE / GDPR compliance |
| 404 | branded | branded | branded | Terminal-style "404: coffee not found" |
| Admin | `/admin` | — | — | Payload panel, `noindex`, auth required |

Services (from current site, kept): Webs & landing pages · Tiendas online · Scripts FiveM · Servidores FiveM llave en mano · Bots de Discord · Mantenimiento web mensual · Desarrollo a medida.

---

## 5. Content model (Payload)

All user-visible text fields are `localized: true` with locales `es` (default), `en`, `fr`, fallback to `es`.

### Collections
| Collection | Key fields | Notes |
|-----------|-----------|-------|
| `users` | name, email, role (`admin` / `editor`) | Auth collection. Only admins create users. No public signup |
| `team-members` | name, slug, role*, location, since (year), bio*, shortBio*, photo, skills[], githubUsername, socials[], order, available (bool) | GitHub repos/stars fetched server-side (§9), manual fallback fields |
| `services` | title*, slug*, summary*, body* (rich text), features[]*, priceFrom, priceUnit*, typicalTime*, tags[], icon, faq[]*, seo group*, order | Each service = Meta Ads landing |
| `projects` | title*, slug*, category*, summary*, body*, cover, gallery[], stack[], year, status (`live`/`in-progress`), url, nda (bool), featured | NDA hides URL/client name |
| `faqs` | question*, answer*, category, order | Feeds `FAQPage` schema |
| `contacts` | name, email, phone, projectType, budget, timeline, message, locale, howFound, ndaRequested, consent, utm{source,medium,campaign,content,term}, fbclid, status (`new`/`in-progress`/`answered`/`archived`), assignedTo → users, internalNotes, createdAt | **Read-only for public**, create only via `/api/contact`. Admin list filtered by status |
| `media` | file, alt* | Vercel Blob storage, alt text required |

(* = localized)

### Globals
| Global | Fields |
|--------|--------|
| `site-settings` | company name, tagline*, contact email, social links, default SEO*, Meta Pixel ID, OG image |
| `home` | hero headline*, subheadline*, stats[] (value + label*), section titles*, CTA labels* |
| `legal` | legal notice*, privacy policy*, cookie policy* (rich text) |

### Access control
- Public (unauthenticated): read published `services`, `projects`, `team-members`, `faqs`, globals. **No** access to `contacts` or `users`.
- `editor`: edit content, read/update `contacts`.
- `admin`: everything + user management.
- Drafts/versions enabled on `services`, `projects`, `home` so the team can preview before publishing (Payload Live Preview).

---

## 6. Visual design — "Espresso Terminal" (evolution of current brand)

### Keep (brand equity)
- Coffee + terminal concept, tagline **"sin café no hay código"**, `while(coffee) { ship("great"); }` motif.
- Current palette tokens (from coffeeprojects.es `:root`): `--bg-0 #0B0706`, `--bg-1 #120C09`, `--amber #F5A742`, `--amber-hi #FFC165`, `--amber-deep #C7782A`, `--crema #FFE8B5`, `--latte #C7A17A`, `--mint #6EE7B7`, `--ink-0 #FFF7E8`, `--ink-2 #A89584`.
- JetBrains Mono for code/terminal accents.

### Evolve (premium)
- **Typography:** replace Space Grotesk with **Bricolage Grotesque** (display) + **Geist** (body), JetBrains Mono kept — all via `next/font/google`, self-hosted at build time (decided in plan T02). Drop "Press Start 2P" pixel font (reads as hobby, not premium).
- **Depth & materials:** glassmorphism cards with amber rim light, subtle film grain, soft volumetric "steam" gradients.
- **Light mode:** optional "latte" theme (crema background) — keep dark as default.
- **Grid:** bento-grid layouts for services and stats.

### Signature moments (the "wow")
1. **Hero 3D scene:** a stylized coffee cup whose steam particles morph into code glyphs, reacting to cursor/scroll (React Three Fiber, lazy-loaded after LCP, static poster image as LCP element and as fallback on low-end devices / `prefers-reduced-motion`).
2. **Live terminal intro:** typed command `~ coffeeprojects $ brew --team` that prints the three team members.
3. **Scroll storytelling (GSAP ScrollTrigger):** "Proceso" section pinned: Descubrimiento → Propuesta → Desarrollo → QA → Entrega, each step animating in.
4. **Magnetic CTAs** and cursor-follower glow on desktop.
5. **Animated counters** with real numbers only (3 devs, 50+ FiveM scripts, < 24h response, 3 languages). **No fake or zero-value stats.**
6. **Infinite marquee** of the tech stack with real SVG logos (not emojis).
7. **Team cards** that flip/expand to show the profile + live GitHub stats.
8. **Page transitions** with View Transitions (shared element morph from card → detail page).

### Performance guardrails for animation
- Respect `prefers-reduced-motion` everywhere (disable 3D, scroll pinning, smooth scroll).
- 3D and GSAP code split and loaded only client-side, never blocking LCP.
- JS budget: < 200 KB gzipped on the initial route excluding the lazy 3D chunk.

---

## 7. Page content structure (Home)

1. **Hero** — headline, subheadline, primary CTA "Pide tu presupuesto" + secondary "Ver servicios", 3D scene, trust line (response < 24h · fixed price · NDA available).
2. **Stats bento** — real numbers.
3. **Services** — 7 cards → service landing.
4. **Why us** — differentiators: single point of contact, fixed-price proposals, weekly reviews, code ownership for the client, NDA, maintenance.
5. **Process** — pinned scroll story (5 steps, from current FAQ).
6. **Team** — 3 cards (Erik, Diego, Juan).
7. **Projects** — featured portfolio.
8. **Stack marquee.**
9. **FAQ** — accordion + `FAQPage` schema.
10. **Final CTA band** — "¿Hablamos de tu proyecto?" + short form (name, email, project type) linking to the full form.
11. **Footer** — contact, socials, legal links, language switcher.

Persistent: sticky header with CTA button; floating mobile CTA bar after first scroll.

---

## 8. Conversion & Meta Ads

### CTAs
- Primary CTA on every page above the fold and at the end.
- Each service landing: hero with service-specific promise + price-from + typical time + CTA, benefits, deliverables, FAQ for that service, testimonial slot (empty until real testimonials exist — **never invent testimonials**), sticky CTA.
- Contact form pre-selects project type when coming from a service landing (`?type=webs`).

### Tracking
| Event | Where | Pixel (browser) | CAPI (server) |
|-------|-------|-----------------|---------------|
| `PageView` | all pages | ✅ | — |
| `ViewContent` | service landing | ✅ (`content_name` = service) | — |
| `Contact` | click on email / chat link | ✅ | — |
| `Lead` | successful form submit | ✅ with `eventID` | ✅ same `event_id` (deduplication), hashed email/phone (SHA-256), `fbp`/`fbc`, client IP + UA |

- UTM parameters and `fbclid` captured on landing, stored in a first-party cookie, saved with each contact → the panel shows which campaign produced each lead.
- Pixel ID and CAPI access token in environment variables (token server-only). Use Meta's **test event code** on staging.

### Consent (GDPR / LSSI-CE — mandatory in Spain)
- Own cookie banner with **Reject / Accept / Configure**, equal prominence for Reject.
- Meta Pixel loads with `fbq('consent', 'revoke')` and is granted only after marketing consent.
- CAPI `Lead` event sent only if the user consented to marketing cookies (consent flag sent with the form).
- Consent stored 6 months, changeable from the footer ("Configurar cookies").

---

## 9. Data integrations

- **GitHub stats** (repos, stars, top repos) fetched server-side with a GitHub token, cached with ISR (revalidate every 12h). If the API fails, show the manual fallback values from the panel — **never show `—` or empty stats** (bug on the current site).
- **Contact form flow:** client Zod validation → Turnstile → `POST /api/contact` → server Zod validation + rate limit (5/hour/IP) + honeypot → create `contacts` doc → email to `contact@coffeeprojects.es` (Resend) → auto-reply to client in their locale → Meta CAPI `Lead` (if consent) → redirect to localized thank-you page.
- **Revalidation:** Payload `afterChange` hooks call `revalidatePath`/`revalidateTag` so published edits appear without redeploy.

---

## 10. SEO

- Metadata per page and locale from Payload `seo` fields (title ≤ 60, description ≤ 155) with sensible fallbacks.
- `hreflang` alternates (`es`, `en`, `fr`, `x-default` → `es`) on every page; canonical URLs.
- `sitemap.xml` generated from Payload content per locale; `robots.txt` (blocks `/admin`, `/api`; staging blocks everything).
- Structured data (JSON-LD): `Organization` + `ProfessionalService` (areaServed Spain/worldwide, contact point), `WebSite`, `Service` per service with `offers.price`, `Person` per member, `FAQPage`, `BreadcrumbList`, `CreativeWork` per project.
- Dynamic Open Graph images per page/locale (`next/og`) in brand style.
- Semantic HTML, one `h1` per page, descriptive alt text (required field in `media`).
- `next/image` with AVIF/WebP; self-hosted fonts with `display: swap`.
- Redirects: 301 from any old URL (e.g. `/#servicios`) only if they existed as real paths — audit current sitemap during implementation.
- Post-launch checklist: Google Search Console + Bing Webmaster (submit sitemaps), Google Business Profile (recommended, outside code).

---

## 11. Quality & testing

| Check | Tool | Gate |
|-------|------|------|
| Types & lint | `tsc --noEmit`, ESLint | CI on every PR |
| Unit | Vitest — Zod schemas, CAPI payload hashing, UTM capture, locale helpers | CI |
| E2E | Playwright — navigation in 3 locales, language switcher keeps page, contact form happy path + validation errors + spam rejection, admin login + contact status change | CI against Vercel preview |
| Visual | Playwright screenshots of key pages (desktop + mobile) | Manual review on staging |
| Performance/SEO/a11y | Lighthouse CI (mobile) | ≥ 95 in all categories |
| Accessibility | axe via Playwright | 0 serious/critical violations |
| Structured data | Google Rich Results Test | Manual before production |

---

## 12. Security & compliance

- Admin only via Payload auth; strong passwords; no public user registration; `/admin` is `noindex`.
- Security headers: CSP (allow Meta, Turnstile, Vercel), HSTS, X-Frame-Options/`frame-ancestors`, Referrer-Policy, Permissions-Policy.
- Secrets only in Vercel env vars, separate values for staging and production.
- Legal pages (aviso legal, privacidad, cookies) — **texts must be provided/reviewed by the company** (company legal name, NIF/CIF, address). The site will have editable placeholders, clearly marked, that block production until filled.
- Contact data retention: documented in privacy policy; admins can delete contacts on request (right to erasure).

---

## 13. Environments & delivery

| Env | Branch | URL | Protection | Indexing | DB | Meta |
|-----|--------|-----|-----------|----------|----|------|
| Local | any | `localhost:3000` | — | no | Neon dev branch or local Postgres | test events |
| Staging (prototype) | `staging` | Vercel preview URL (optionally `staging.coffeeprojects.es`) | Vercel Deployment Protection | `noindex` + robots disallow all | Neon `staging` branch | test event code |
| Production | `main` | `coffeeprojects.es` | public site, `/admin` auth | indexed | Neon `main` | live |

Promotion: PR `staging` → `main` after team validation checklist (in the implementation plan) is complete.

---

## 14. Open questions (must be answered before or during implementation)

| # | Question | Blocks |
|---|----------|--------|
| Q1 | Erik's GitHub username and preferred contact channels (LinkedIn?) | Erik profile stats |
| Q2 | Photos of the 3 members (or avatars/illustrations?) | Team section |
| Q3 | Company legal data (legal name, NIF/CIF, address) for legal pages | Production only |
| Q4 | Keep the "Abrir chat" feature? Current site has a chat button — which service (Discord, WhatsApp, Crisp…)? | Contact section |
| Q5 | Meta Business Manager: Pixel ID + CAPI token available? | Tracking (can be wired with placeholders) |
| Q6 | Real testimonials from past clients? | Social proof section (hidden until filled) |
| Q7 | Vercel plan (Pro required for production, see §3) and who owns the Vercel team / GitHub org | Deployment |
| Q8 | Keep the "Ver tienda" link for FiveM scripts — current URL? | Service landing |
| Q9 | Can the team answer clients in French, or is French only the site language (replies in ES/EN)? | Copy, auto-reply email in FR |
| Q10 | Real online-store timeline: "3-5 semanas" (current FAQ) or "4-8 semanas" (current card)? | Services copy |

Copy (team bios, headlines, CTAs) lives in `02-content-es.md`.
