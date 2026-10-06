# T00 — External accounts and secrets (human actions)

> These steps need a human (account creation, payment plans, DNS). An agent must NOT create accounts or enter credentials. The agent prepares the checklist, the humans execute it, and the agent continues with T01 using the values placed in `.env.local` by a human.

**Interfaces:**
- Produces: values for every variable in the "Environment variables" table of `docs/03-implementation-plan.md`.

- [ ] **Step 1: GitHub** — create a **private** repository `coffeeprojects-web` in the company GitHub account/organization. Invite Diego, Juan and Erik with write access.
- [ ] **Step 2: Vercel** — create (or reuse) a Vercel team. Production requires the **Pro** plan (Hobby is non-commercial). Import the GitHub repo later in T18 (not now).
- [ ] **Step 3: Neon Postgres** — from Vercel → Storage → Marketplace → Neon, create database `coffeeprojects`. Create Neon branches: `main` (production), `staging`, `dev`. Copy the **pooled** connection string of `dev` into `.env.local` as `DATABASE_URL`.
- [ ] **Step 4: Vercel Blob** — Vercel → Storage → Blob → create store `coffeeprojects-media`. Copy `BLOB_READ_WRITE_TOKEN`.
- [ ] **Step 5: Resend** — create account, add domain `coffeeprojects.es`, add the DNS records Resend shows (SPF, DKIM) at the domain registrar, wait until verified. Create API key → `RESEND_API_KEY`.
- [ ] **Step 6: Cloudflare Turnstile** — create a widget for `coffeeprojects.es` and the staging hostname. For local dev/staging the published test keys in the env table are enough; production keys go in Vercel production env only.
- [ ] **Step 7: Meta** — in Meta Business Manager → Events Manager create (or reuse) a Pixel/Dataset. Copy Pixel ID, generate a Conversions API token, and note the **Test Event Code** for staging.
- [ ] **Step 8: GitHub token (optional)** — fine-grained token with no repo scopes (public data only) → `GITHUB_TOKEN`.
- [ ] **Step 9: Secrets** — generate `PAYLOAD_SECRET`, `IP_HASH_SALT`, `PREVIEW_SECRET` with `openssl rand -hex 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
- [ ] **Step 10: Answer open questions** Q1–Q10 from spec §14 (Q3 legal data and Q7 Vercel plan block production only).

Verification: a human confirms every row of the env table has a value for `development`. Missing optional values (`GITHUB_TOKEN`, Meta) are allowed — the code degrades gracefully.
