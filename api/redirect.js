// GET /r/:slug  (rewritten to /api/redirect?slug=:slug by vercel.json)
// Looks up the destination, counts the scan, and 302-redirects to WhatsApp.
const { getLink, redisPipeline, send } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const slug = (req.query && req.query.slug) || '';
    if (!slug) { res.statusCode = 302; res.setHeader('Location', '/'); return res.end(); }

    const link = await getLink(slug);
    if (!link) { res.statusCode = 302; res.setHeader('Location', '/?e=notfound'); return res.end(); }

    if (link.expiresAt && Date.now() > link.expiresAt) {
      res.statusCode = 302;
      res.setHeader('Location', '/dynamic.html?expired=' + encodeURIComponent(slug));
      return res.end();
    }

    // Count the scan (best-effort; never block the redirect on it).
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    redisPipeline([
      ['INCR', 'scans:' + slug],
      ['INCR', 'scans:' + slug + ':' + day],
      ['EXPIRE', 'scans:' + slug + ':' + day, 8640000], // ~100 days
    ]).catch(() => {});

    let dest = 'https://wa.me/' + link.phone;
    if (link.message && link.message.trim()) dest += '?text=' + encodeURIComponent(link.message);

    res.statusCode = 302;
    res.setHeader('Location', dest);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.end();
  } catch (e) {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }
};
