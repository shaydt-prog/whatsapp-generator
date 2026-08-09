// POST /api/update
// Body: { slug, key, cc, phone, message }
// Changes where an existing dynamic link points — no reprint needed.
const { getLink, saveLink, cleanPhone, send } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { slug, key } = body;
    if (!slug || !key) return send(res, 400, { error: 'Missing slug or key' });

    const link = await getLink(slug);
    if (!link) return send(res, 404, { error: 'Link not found' });
    if (link.editKey !== key) return send(res, 403, { error: 'Wrong management key' });

    const fullPhone = cleanPhone(body.cc, body.phone);
    if (fullPhone.length < 8) return send(res, 400, { error: 'Invalid phone number' });

    link.phone = fullPhone;
    link.message = String(body.message || '').slice(0, 300);
    link.updatedAt = Date.now();
    await saveLink(slug, link);

    return send(res, 200, { ok: true, slug, phone: link.phone, message: link.message });
  } catch (e) {
    return send(res, 500, { error: e.message || 'Server error' });
  }
};
