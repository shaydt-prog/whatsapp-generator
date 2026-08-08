# WhatsApp Link & QR Code Generator (whatsappqr.com)

An independent, free tool to create WhatsApp click-to-chat (`wa.me`) links and
download QR codes. Everything runs in the browser — no backend, no account.

> **Independent tool.** Not affiliated with, endorsed by, or sponsored by
> WhatsApp or Meta Platforms, Inc. "WhatsApp" is a trademark of Meta Platforms, Inc.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The app (single-file React via Babel standalone). |
| `privacy.html`, `terms.html`, `refund.html` | Legal/trust pages linked in the footer. |
| `SAFE-BROWSING-FIX.md` | **Read this** — why Chrome flagged the site and the exact steps to clear it. |
| `MONETIZATION.md` | Honest, non-deceptive ways to earn from the traffic. |
| `ISRAEL-PAYMENT-GUIDE.md` | PayPal / Israeli payment gateway setup notes. |
| `whatsappqr-image.png`, `whatsappqr-stick.gif` | Marketing images used on the page. |

## What's free vs. Pro

- **Free forever:** generate links, live QR preview, copy link, **download PNG**.
- **Pro ($9.99 one-time):** logo inside the QR, custom colors, vector **SVG**
  export, and high-resolution PNG for print.

The free PNG download is intentionally free. Charging to "unlock" a QR the user
already sees was the main reason the site got flagged as deceptive — see
`SAFE-BROWSING-FIX.md`.

## Deploying

It's a static site. Any static host works (Vercel, Netlify, Cloudflare Pages,
GitHub Pages). Deploy the whole folder so the `.html` legal pages and images ship
alongside `index.html`.

## Before going live / requesting a Safe Browsing review

1. Make sure `support@whatsappqr.com` actually receives email (set up forwarding).
2. Replace the PayPal client ID in `index.html` with your **live** client ID if
   you haven't already.
3. Follow the review steps in `SAFE-BROWSING-FIX.md`.

## Payments

Payment for the Pro upgrade is handled by PayPal (client-side SDK). The unlock is
currently stored in the browser's local storage, so it applies per device. See
`MONETIZATION.md` for when/how to add a proper license-key backend as revenue grows.
