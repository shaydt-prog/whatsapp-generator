// GET /api/stats?slug=...&key=...
// Returns scan totals + last 30 days for the owner (editKey required).
const { getLink, redis, redisPipeline, send } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const slug = (req.query && req.query.slug) || '';
    const key = (req.query && req.query.key) || '';
    if (!slug || !key) return send(res, 400, { error: 'Missing slug or key' });

    const link = await getLink(slug);
    if (!link) return send(res, 404, { error: 'Link not found' });
    if (link.editKey !== key) return send(res, 403, { error: 'Wrong management key' });

    const total = parseInt((await redis(['GET', 'scans:' + slug])) || '0', 10);

    // Last 30 days
    const days = [];
    const cmds = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push(d);
      cmds.push(['GET', 'scans:' + slug + ':' + d]);
    }
    const counts = await redisPipeline(cmds);
    const daily = days.map((d, i) => ({ date: d, count: parseInt(counts[i] || '0', 10) }));

    return send(res, 200, {
      ok: true,
      slug,
      phone: link.phone,
      message: link.message || '',
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      total,
      daily,
    });
  } catch (e) {
    return send(res, 500, { error: e.message || 'Server error' });
  }
};
