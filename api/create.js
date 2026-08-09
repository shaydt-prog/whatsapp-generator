// POST /api/create
// Body: { orderID, cc, phone, message, slug }
// Verifies the PayPal payment, then creates a dynamic link valid for 1 year.
const {
  DYNAMIC_PRICE, TERM_DAYS, reserveLink, claimOrder,
  verifyPaypalOrder, sanitizeSlug, randomKey, cleanPhone, send,
} = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { orderID, cc, phone, message } = body;

    const fullPhone = cleanPhone(cc, phone);
    if (fullPhone.length < 8) return send(res, 400, { error: 'Invalid phone number' });
    if (!orderID) return send(res, 400, { error: 'Missing payment reference' });

    // 1) Verify the payment really happened for the right amount.
    const check = await verifyPaypalOrder(orderID, DYNAMIC_PRICE);
    if (!check.ok) return send(res, 402, { error: 'Payment not verified: ' + check.reason });

    // 2) Make sure this payment can't be reused to mint multiple links.
    const firstUse = await claimOrder(orderID);
    if (!firstUse) return send(res, 409, { error: 'This payment was already used.' });

    // 3) Reserve a slug.
    const now = Date.now();
    const record = {
      phone: fullPhone,
      message: String(message || '').slice(0, 300),
      editKey: randomKey(24),
      createdAt: now,
      expiresAt: now + TERM_DAYS * 86400000,
      plan: 'dynamic',
      orderID,
    };

    let slug = sanitizeSlug(body.slug);
    let reserved = false;
    if (slug && slug.length >= 3) {
      reserved = await reserveLink(slug, record);
      if (!reserved) return send(res, 409, { error: 'That name is taken — try another.' });
    } else {
      for (let i = 0; i < 6 && !reserved; i++) {
        slug = randomKey(7);
        reserved = await reserveLink(slug, record);
      }
      if (!reserved) return send(res, 500, { error: 'Could not allocate a link, try again.' });
    }

    const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
    return send(res, 200, {
      ok: true,
      slug,
      editKey: record.editKey,
      shortUrl: `${origin}/r/${slug}`,
      manageUrl: `${origin}/manage.html?slug=${slug}&key=${record.editKey}`,
      expiresAt: record.expiresAt,
    });
  } catch (e) {
    return send(res, 500, { error: e.message || 'Server error' });
  }
};
