# Fixing the "Dangerous / Deceptive site" warning in Chrome

Chrome's red warning comes from **Google Safe Browsing**, a database Google
maintains separately from your website. **Editing the site does not remove the
warning by itself** — you must (1) fix the things that triggered it, then
(2) ask Google to re-review the site. This guide covers both.

---

## Part 1 — Why the site was almost certainly flagged

In order of likely impact:

1. **Deceptive payment pattern (biggest).** The old version generated the QR
   code for free in the browser, then blurred it behind a padlock and charged
   $2.99 to "unlock the download." Charging to reveal something the user is
   already looking at — and that is free on every other QR site — is exactly
   what Safe Browsing's "deceptive / billing" category is meant to catch. It
   also generates angry user reports, which accelerate a flag.
   → **Fixed in code:** the PNG download is now free for everyone. Payment only
   buys genuine extras (logo, colors, SVG, hi-res).

2. **Brand impersonation risk.** The domain contains the trademark "WhatsApp",
   the page mimics WhatsApp's green branding, and there was **no statement that
   the site is independent**. Safe Browsing flags pages that appear to act on
   behalf of a brand they don't represent.
   → **Fixed in code:** a non-affiliation notice now appears at the top of every
   page, in the footer, in the SEO copy, and on every legal page.
   ⚠️ See Part 4 — the domain name itself remains a separate legal risk.

3. **No privacy policy, terms, refund policy, or contact.** A site that takes
   payments with none of these looks like a throwaway scam and also violates
   PayPal's own rules.
   → **Fixed in code:** added `privacy.html`, `terms.html`, `refund.html`, and a
   `support@whatsappqr.com` contact link in the footer.

4. **Placeholder/unfinished configuration.** The page shipped with `yoursite.com`
   in the canonical tag, Open Graph and Twitter tags and schema.org data, plus a
   second conflicting canonical. That "unfinished template" look is a low-quality
   signal.
   → **Fixed in code:** all URLs now point to `https://whatsappqr.com/`, and the
   duplicate canonical was removed.

---

## Part 2 — Do these before requesting a review

- [ ] **Deploy the updated site** (index.html + privacy/terms/refund pages).
- [ ] **Set up the `support@whatsappqr.com` inbox.** It must actually receive
      mail — Google and PayPal both check that support contact works. Easiest
      option: a free forwarding alias on your domain that forwards to your
      personal inbox (most registrars/hosts offer this).
- [ ] **Confirm the legal pages load** at `/privacy.html`, `/terms.html`,
      `/refund.html` and that the footer links work.
- [ ] **Remove any remaining "unlock/blur" language** from ads, screenshots or
      social posts that imply you pay to see the QR.

## Part 3 — Request the re-review (this is what actually clears the warning)

1. **Add the site to Google Search Console** (if not already):
   <https://search.google.com/search-console>. Verify ownership (DNS TXT record
   or an HTML file — DNS is easiest).
2. Open **Security & Manual Actions → Security Issues**. It will list the
   specific problem Google detected ("Deceptive pages", "Social engineering",
   etc.). Read the exact wording — it tells you precisely what to confirm you've
   fixed.
3. Click **"Request Review"**, and in the box describe what you changed, e.g.:
   > "The site is an independent WhatsApp link/QR generator. We removed the paid
   > download gate — QR downloads are now free. We added a clear non-affiliation
   > disclaimer with WhatsApp/Meta, plus Privacy Policy, Terms and Refund Policy
   > pages and a working support contact. Please re-review."
4. Submit. Reviews typically take **a few days up to ~2 weeks**. You'll be
   notified in Search Console when it clears.
5. **Also check the standalone report** at
   <https://transparencyreport.google.com/safe-browsing/search> — enter
   `whatsappqr.com` to see the current status any time.

> If Chrome shows the warning but Search Console reports *no* security issue, the
> block may be coming from a **user "report as unsafe" queue** or from your host.
> In that case, submit a false-positive appeal here:
> <https://safebrowsing.google.com/safebrowsing/report_error/>

## Part 4 — The domain name itself (important, honest)

A disclaimer greatly reduces the *Safe Browsing* signal, but it does **not**
remove the underlying **trademark** exposure: `whatsappqr.com` contains Meta's
"WhatsApp" mark. Meta actively reports and pursues domains that use it, and a
trademark complaint to your registrar can get the domain suspended regardless of
Safe Browsing.

Two realistic paths:

- **Keep the name (lower effort, some ongoing risk).** Rely on *nominative fair
  use* — using the word only to describe compatibility — backed by the prominent
  disclaimer now in place. This is the common approach for "tool for X" sites,
  but it is not a guarantee against a Meta complaint.
- **Rebrand the domain (safest long-term).** Move to a name that doesn't contain
  the trademark, e.g. `chatqr.link`, `qrforchat.com`, `clicktochat.co`,
  `wa-qr.com` (still risky), `messagelinkqr.com`. Set up 301 redirects from the
  old domain so you keep your SEO and 2k weekly visits. A fresh domain also
  starts with a clean Safe Browsing history.

My recommendation: request the review now on the current domain to stop the
immediate bleeding, and plan a rebrand as the durable fix — especially before
you invest in paid ads, which Google/Bing will reject for a trademarked-plus-flagged
domain.

---

## Quick checklist

- [ ] Deploy updated code (free downloads, disclaimer, legal pages)
- [ ] Make `support@whatsappqr.com` receive email
- [ ] Verify domain in Google Search Console
- [ ] Read the exact issue under Security Issues, then Request Review
- [ ] Check Bing Webmaster Tools too (Bing has its own Safe Browsing)
- [ ] Decide: keep domain with disclaimer, or rebrand + 301 redirect
