# Pending work (snapshot 2026-10-09)

Everything below is ready to pick up; nothing here blocks the current site. Status of the code: `main` = `staging`, deployed at https://coffeeprojects-web.vercel.app (noindex staging site).

## 1. Email (Resend) — finish setup and test

Already done: Resend domains, API key, `email.received` webhook and Vercel env vars (see `docs/06-email-setup.md`, section "Current state").

1. In Cloudflare (DNS of `coffeeprojects.es`), add the records listed in `docs/06-email-setup.md` (DNS only / grey cloud). Do not touch the IONOS MX/SPF records.
2. In Resend > Domains, click "Verify" on `coffeeprojects.es` and `inbound.coffeeprojects.es` (or ask Claude to run `verify-domain`), wait until both show "Verified".
3. End-to-end test on the live site:
   - Send a contact request from `/contacto` (try /en too) -> every panel user receives the notification; the client receives the confirmation from `contact@coffeeprojects.es` with the thank-you PDF attached, in the language used on the site, and the request lists it under "Agradecimientos enviados" with no author.
   - Answer it from the panel ("Responder") -> client receives it, request shows "Respondida" with channel `panel`.
   - Answer another notification by email (Gmail/Outlook "Reply") -> client receives it from `web@coffeeprojects.es`, request shows the reply with channel `email`.
   - In a request, "Agradecimiento (PDF)" -> "Enviar al cliente" -> client receives the PDF from `contact@coffeeprojects.es` (a reply lands in IONOS), the request shows it under "Agradecimientos enviados".
4. Until step 2 is done: requests are stored, notifications are skipped (logged) and "Responder" / "Enviar al cliente" (thank-you PDF) show an error; "Descargar para revisar" works.

## 2. Small manual edits

- `.env.example`: add (the agent cannot read `.env*` files):
  ```
  RESEND_INBOUND_DOMAIN=   # e.g. inbound.coffeeprojects.es
  RESEND_WEBHOOK_SECRET=   # whsec_...
  ```
- Panel > Ajustes > Legal > Política de privacidad: remove the mention of "presupuesto aproximado y plazo" (the form no longer asks for them; it shows the final price with VAT and the estimated time).
- Panel: check that uploading a profile photo works and that the cup icon shows in the breadcrumb (fixed in 453295d, not yet checked with a logged-in session).

## 3. Other external setup

- Meta: `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_TEST_EVENT_CODE`.
- Cloudflare Turnstile: real keys (hostname must match `NEXT_PUBLIC_SITE_URL`); test keys are in use now.
- GitHub Actions secrets `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` for CI.
- Legal company data for the `[PENDIENTE]` markers (legal pages stay noindex until filled).

## 4. Decisions still open

- Performance budget for the home page on mobile (Lighthouse ~65).
- HSTS preload.
- Footer navigation links (Services, Projects, Team, Contact).
- Custom plan priced below Landing Premium (v4 open item: "desde 690 € / 990 €"?).

## 5. Known minor technical follow-ups

- `appendReply` reads and rewrites the whole replies list: a panel reply and an email reply at the same instant could overwrite each other (low probability; fix with a transaction or a unique index on `contacts_replies.inbound_id`).
- No CSRF origin allow-list (`csrf`/`serverURL`): kept off on purpose because it breaks the admin on local ports, CI and preview URLs; `SameSite=Lax` cookies cover cross-site POSTs.
- Preview and production share the same Neon database: deploy schema changes straight to `main`, and after a seed that fills new globals, redeploy (pages are prerendered at build time).
