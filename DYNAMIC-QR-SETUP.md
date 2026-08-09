# Dynamic QR service — setup (≈15 minutes)

This adds a **paid, recurring** product to the site: a dynamic WhatsApp QR that
the owner can re-point without reprinting, plus scan analytics. It's built as
Vercel serverless functions + Upstash Redis storage, with **server-side PayPal
verification** so the paid feature can't be unlocked for free.

**Pricing:** $12/year per link (one-time PayPal payment; the link is set to
expire after 365 days and can be renewed).

> ⚠️ These functions were written but **not run end-to-end in this environment**
> (no live database or PayPal credentials here). Do the steps below, then run the
> smoke test at the end before promoting it.

## What was added

```
api/_lib.js       shared helpers (Redis REST + PayPal verify)   (not a public route)
api/create.js     POST — verify payment, mint a dynamic link
api/redirect.js   GET  — /r/:slug → count scan → 302 to WhatsApp
api/stats.js      GET  — owner analytics (needs management key)
api/update.js     POST — change a link's destination
vercel.json       rewrite /r/:slug → /api/redirect
dynamic.html      buy + create page (PayPal)
manage.html       dashboard: analytics + edit destination
```

## Step 1 — Create a Redis store (Upstash via Vercel, free tier)

1. In your Vercel project → **Storage** → **Create Database** → **Upstash for
   Redis** (a.k.a. Vercel KV). Accept the free plan.
2. **Connect** it to this project. Vercel automatically injects these env vars:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

   (If you use Upstash directly instead, set those two vars yourself to the
   Upstash "REST URL" and "REST TOKEN".)

## Step 2 — Add PayPal server credentials

The site already uses your PayPal **client ID** in the browser. The server needs
the matching **secret** to verify payments.

1. <https://developer.paypal.com> → your app → copy **Client ID** and **Secret**
   (use **Live** credentials for real money).
2. In Vercel → **Settings → Environment Variables**, add:
   - `PAYPAL_CLIENT_ID` = your live client ID
   - `PAYPAL_CLIENT_SECRET` = your live secret
   - `PAYPAL_ENV` = `live`  (use `sandbox` while testing)
3. Redeploy so the functions pick up the variables.

> While testing, set `PAYPAL_ENV=sandbox` and temporarily swap the client-id in
> the `<script src="...paypal.com/sdk/js?client-id=...">` tag of `dynamic.html`
> for your **sandbox** client id. Switch both back to live before launch.

## Step 3 — Deploy

Push to the branch / merge. Vercel builds the `/api` functions automatically —
no build config needed (plain Node, no dependencies).

## Step 4 — Smoke test

1. Open `/dynamic.html`. Enter a number, pick a link name.
2. Pay with a PayPal **sandbox** buyer account.
3. You should land on "Your dynamic QR is live" with a short link, a manage link,
   and a management key. **Save the key.**
4. Visit `/r/<yourname>` → it should redirect to WhatsApp.
5. Open the manage link → the scan should show up in analytics (give it a few
   seconds; refresh).
6. Change the destination number, Save, and scan again → new number opens.

## How the money is protected

- The browser captures the PayPal payment, then calls `/api/create` with the
  order id. The **server** re-checks that order with PayPal (status `COMPLETED`,
  amount ≥ $12, currency USD) before creating anything — a fake client call
  can't mint a link.
- Each PayPal order id is single-use (`claimOrder`), so one payment = one link.
- The management key (not guessable) is required to view analytics or edit a
  link.

## Costs

- Upstash free tier: ~10k commands/day — plenty for thousands of scans.
- Vercel Hobby/Pro: serverless functions included.
- So at your traffic this runs at **≈ $0** infra cost; it's close to pure margin.

## Good next upgrades (optional)

- **Email the management key** on purchase (add a transactional email step in
  `create.js`) so buyers don't lose it. Until then, they must save it on the
  success screen — that's why it's shown prominently.
- **Renewal reminders**: a scheduled job that emails owners ~14 days before
  `expiresAt`.
- **Bulk / multi-location** plans for businesses with many codes.
