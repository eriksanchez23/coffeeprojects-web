# Email setup (Resend)

How the site sends email, and how the team can answer contact requests from their own inbox with the
reply synced into the panel (S18, S19, S21).

## What each piece needs

| Feature | Env vars | Without them |
|---|---|---|
| Team notification for each new request + confirmation to the client (S18) | `RESEND_API_KEY`, optional `EMAIL_FROM_ADDRESS`, optional `CONTACT_NOTIFY_EMAIL` | The request is stored, nothing is emailed (an error is logged in production). |
| "Responder" box inside a request in the panel (S19) | `RESEND_API_KEY` | The box shows an error and nothing changes. |
| Answer by email (Reply in Gmail/Outlook) and sync to the panel (S21) | `RESEND_API_KEY`, `RESEND_INBOUND_DOMAIN`, `RESEND_WEBHOOK_SECRET` (plus the existing `PAYLOAD_SECRET`) | Reply in the notification goes straight to the client, as before, and is **not** synced. |
| "Agradecimiento (PDF)" box inside a request: thank-you PDF emailed to the client (S22) | `RESEND_API_KEY`, optional `THANK_YOU_FROM_ADDRESS` | "Descargar para revisar" still works; "Enviar al cliente" shows an error and nothing is stored. |

- `EMAIL_FROM_ADDRESS`: sender of every email (default `hola@coffeeprojects.es`). Its domain must be verified in Resend for sending.
- `THANK_YOU_FROM_ADDRESS`: sender of the thank-you PDF email (default `contact@coffeeprojects.es`; shown as "CoffeeProjects <address>", replies go to `contact@coffeeprojects.es`, i.e. the IONOS mailbox). Its domain must be verified in Resend. Sent through the Resend API directly (attachment + `Idempotency-Key`), not through `EMAIL_FROM_ADDRESS`.
- `RESEND_INBOUND_DOMAIN`: the receiving subdomain, e.g. `inbound.coffeeprojects.es`. Use a dedicated subdomain: Resend receives **all** mail for it.
- `RESEND_WEBHOOK_SECRET`: the signing secret of the Resend webhook (starts with `whsec_`).
- The relay addresses are signed with a key derived from `PAYLOAD_SECRET`. Rotating `PAYLOAD_SECRET` invalidates the Reply-To of notifications already sent (replies to them are then ignored).

Set the variables in Vercel (Project, Settings, Environment Variables) for each environment and redeploy.

## How "answer by email" works (S21)

1. A new request arrives. Each team user gets the notification; its **Reply-To** is a signed address of that
   request, `r+<id>.<signature>@<RESEND_INBOUND_DOMAIN>`.
2. A team user presses Reply in their mail app and writes the answer.
3. Resend receives it and calls our webhook `POST https://<site>/api/inbound/resend` (`email.received`).
4. The site checks the webhook signature, the relay address signature, that the sender is the email of a
   user in the panel, and that the sender passed SPF/DKIM/DMARC. It downloads the email body from Resend,
   keeps only the new text (the quoted history is removed), and sends it to the client **from our address**
   with Reply-To = that team user.
5. The reply is added to the request's "Respuestas enviadas" history (channel "Email", author = that user)
   and the status becomes "Respondida".

Anything else sent to the inbound domain (unknown or tampered addresses, people who are not team users,
duplicate deliveries) is acknowledged and ignored. If fetching, forwarding or saving fails, the webhook
answers 500 and Resend retries; the forward reuses the same idempotency key, so the client never gets the
same answer twice (Resend keeps the key for 24 hours).

Limitations:

- Only the reply to the **notification email** syncs. When the client answers back, it goes to the team
  user's own inbox (Reply-To of the forwarded email), and that later back-and-forth is not synced.
- The quoted history is detected for the usual Gmail/Apple Mail/Outlook formats in Spanish, English and
  French. Check the history in the panel if a client mentions an odd-looking email.
- Attachments are not forwarded.
- The client sees the subject the team user's mail app used (usually `Re: Nueva solicitud (...) — <name>`).

## Resend setup (once)

1. Resend, **Domains**: verify the sending domain of `EMAIL_FROM_ADDRESS` (already needed for S18/S19).
2. Resend, **Domains**: add the receiving subdomain (e.g. `inbound.coffeeprojects.es`) and enable
   **Receiving**. Add the DNS records Resend shows (including the **MX** record) at the DNS provider and wait
   until the domain is verified.
3. Resend, **Webhooks**, **Add Webhook**: endpoint `https://coffeeprojects.es/api/inbound/resend` (the
   production URL), event **`email.received`**. Save, open the webhook and copy its signing secret
   (`whsec_...`).
4. Vercel: set `RESEND_INBOUND_DOMAIN` and `RESEND_WEBHOOK_SECRET` (plus `RESEND_API_KEY`) and redeploy.
5. Test: send a test request from the contact form with your own address as the client, reply to the team
   notification from your mail app, and check that the client address receives the answer and the request
   shows it in the panel as "Respondida".

The staging deployment is protected by Vercel Authentication (Deployment Protection), so Resend cannot
reach its webhook unless a protection bypass is configured. Point the webhook to production (or configure a bypass for
staging tests).

Troubleshooting: the server logs show `inbound reply: ignored` with a `reason` (`eventType`, `token`,
`sender`, `contact`, `duplicate`, `unauthenticated`, `empty`) or `inbound reply: <step> failed` with only
the provider status. No names, addresses or message text are logged. A 401 answer means the
`RESEND_WEBHOOK_SECRET` does not match the webhook (or the server clock is more than 5 minutes off); 503
means one of the three variables is missing.

## Privacy policy text

The privacy policy seed (`src/seed/data/legal.ts`) no longer mentions the "approximate budget and timeline"
fields removed in S17; it now mentions the price and estimated time summary shown in the form. The seed does
not overwrite a legal page that already exists, so on a live database the team updates it in the panel:
**Ajustes, Legal, Política de privacidad**, edit the "quote requests" paragraph in each language (ES, EN, FR) with
the same text as the seed, and save.

## Current state (2026-10-09)

Configured through the Resend API (region eu-west-1):

- Domain `coffeeprojects.es`: sending only (open/click tracking off).
- Domain `inbound.coffeeprojects.es`: receiving only.
- API key "coffeeprojects-web (Vercel)" (full access: the webhook reads received emails).
- Webhook `email.received` -> `https://coffeeprojects-web.vercel.app/api/inbound/resend`.
- Vercel env (production + preview): `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESEND_INBOUND_DOMAIN=inbound.coffeeprojects.es` (sensitive values are only stored in Vercel/Resend).

DNS for `coffeeprojects.es` is on Cloudflare (mailboxes stay on IONOS: its MX/SPF records are not touched). Records to add there, all "DNS only" (grey cloud):

| Type | Name | Value | Priority |
|------|------|-------|----------|
| TXT | `resend._domainkey` | DKIM value shown in Resend > Domains > coffeeprojects.es | |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | |
| CNAME | `rsend` | `send.forge.rmta.net` | |
| TXT | `resend._domainkey.inbound` | DKIM value shown in Resend > Domains > inbound.coffeeprojects.es | |
| MX | `inbound` | `inbound-smtp.eu-west-1.amazonaws.com` | 10 |
| TXT | `_dmarc` (recommended) | `v=DMARC1; p=none;` | |

Until both domains show "Verified" in Resend, sending from `web@coffeeprojects.es` fails: contact requests are still stored, the team notification is skipped with a log line and the panel's "Responder" shows an error.
