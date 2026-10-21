# Pending work (snapshot 2026-10-10)

Production runs self-hosted since 2026-10-10: `https://coffeeprojects.es` → Cloudflare (proxied, Access on the
admin) → Nginx Proxy Manager (CT 104) → Proxmox CT 113 (`next start` + local Postgres 18). Full history and
evidence: `odd/tasks/selfhost-proxmox.md`. Nothing below blocks the live site.

## 1. Next session

- **Email end-to-end test** (Resend domains are verified, webhook points to production):
  1. Send a request from `/contacto` with a personal address as the client → every panel user gets the
     notification, the client gets the confirmation.
  2. Answer it from the panel ("Responder") → the client receives it, the request shows "Respondida" (channel `panel`).
  3. Answer another notification with Reply in Gmail/Outlook → the client receives it from our address and the
     request shows the reply (channel `email`). Team senders must pass DMARC (`_dmarc` CNAME → IONOS, DNS only).
  4. Check the server logs on CT 113 (`journalctl -u coffeeprojects-web`) for `inbound reply: ignored` reasons.
- **Mobile performance:** Lighthouse mobile on 2026-10-10 = Performance 92, Accessibility 100, Best practices 100,
  SEO 100. Look for the remaining points (LCP of the hero, JS of the 3D/motion layer, consent banner layout shift).
- **Brand in page titles:** inner pages use bare titles ("Servicios de desarrollo a medida"); consider a
  `%s | CoffeeProjects` template.

## 2. After a few stable days

- Remove temporary credentials from CT 113: `/etc/coffeeprojects/vercel.env` (Neon + Vercel Blob) and
  `/root/.cf_token` (Cloudflare DNS edit token). Keep `/root/dns-rollback-apex.json` until Vercel is shut down.
- Shut down the old Vercel project and the Neon database (owner: eriksanchez23) once no rollback is needed.
- Remove `@payloadcms/storage-vercel-blob`, `@vercel/analytics` and `@vercel/speed-insights` (needs a migration
  for the Blob plugin columns, so plan it as its own task).
- Delete the leftover DNS record `panel.coffeeprojects.es` (CNAME to an old Vercel project, not the real panel).
- Google Search Console: confirm the sitemap shows "Correcto" (75 URLs) and check the "Páginas" report for 404s
  of old URLs → add 301 redirects.
- Deploy runbook in `docs/` (update/rebuild, clearing `.next/cache/fetch-cache` after CMS-side scripts, restore
  from the NAS backup, rollback).

## 3. Later

- Meta: `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_TEST_EVENT_CODE` (needs a rebuild: the pixel id is
  baked in at build time).
- External panel / Discord bot integration: create one `integration` user per client in the panel, enable its
  API key, call `http://192.168.1.90:3000/api/...` from the LAN, and add the client's IP to the CT 113 nftables
  `web_clients` set.
- Reply-To of replies sent by an integration user: today it is the integration user's email; decide between the
  assigned team user or a team inbox.
- GitHub Actions secrets `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` for CI.
- Decisions still open: HSTS preload, footer navigation links (Services, Projects, Team, Contact), custom plan
  priced below Landing Premium (v4 open item: "desde 690 € / 990 €"?).

## 4. Known minor technical follow-ups

- `appendReply` reads and rewrites the whole replies list: a panel reply and an email reply at the same instant
  could overwrite each other (low probability; fix with a transaction or a unique index on `contacts_replies.inbound_id`).
- Accepted residual: Payload's built-in `payload-locked-documents` allows any authenticated user; API-key requests
  to it are refused by `src/proxy.ts` and integration actions on contacts are audit-logged.
- Readability advisories from the legal-slice review: `as never` cast and dry-run counter in
  `scripts/update-legal.ts`, hard-coded locale count and Proxy `then` trap in its test.

## Operations reference

- Backups: node timer `coffeeprojects-web-backup.timer` at 00:00 and 12:00 → `disco-nas/backups/coffeeprojects-web/`
  (Postgres dump, media, `app.env` encrypted with age; 14 days). Weekly `vzdump` of CT 113 (Sunday 03:30, last 4).
  The age private key is on the node (`/root/coffeeprojects-backup/age.key`) and in the owner's offline storage.
- Contact retention: CT timer `coffeeprojects-anonymize.timer` daily at 03:15 (contacts inactive for 24 months).
