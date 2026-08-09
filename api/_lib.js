// Shared helpers for the dynamic-QR API (plain Vercel Node functions, no deps).
// Storage: Upstash Redis REST (Vercel KV compatible).
//   Env: KV_REST_API_URL, KV_REST_API_TOKEN
// Payment verification: PayPal REST.
//   Env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV ("live" | "sandbox")

const DYNAMIC_PRICE = 12.0;          // USD / year
const TERM_DAYS = 365;

async function redis(command) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV not configured');
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error('KV error: ' + data.error);
  return data.result;
}

async function redisPipeline(commands) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const res = await fetch(url + '/pipeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  const data = await res.json();
  return Array.isArray(data) ? data.map((d) => d.result) : [];
}

async function getLink(slug) {
  const raw = await redis(['GET', 'link:' + slug]);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Reserve + store a new link only if the slug is free. Returns true on success.
async function reserveLink(slug, obj) {
  const r = await redis(['SET', 'link:' + slug, JSON.stringify(obj), 'NX']);
  return r === 'OK';
}

async function saveLink(slug, obj) {
  await redis(['SET', 'link:' + slug, JSON.stringify(obj)]);
}

// One-time use guard for a PayPal order id. Returns true if this is the first use.
async function claimOrder(orderID) {
  const r = await redis(['SET', 'order:' + orderID, '1', 'NX', 'EX', 7776000]); // 90d
  return r === 'OK';
}

async function paypalToken() {
  const base = process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(base + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return { token: data.access_token, base };
}

// Confirm a captured PayPal order is real, completed, and paid >= expected amount.
async function verifyPaypalOrder(orderID, minAmount) {
  if (!process.env.PAYPAL_CLIENT_SECRET) throw new Error('PayPal not configured');
  const { token, base } = await paypalToken();
  const res = await fetch(`${base}/v2/checkout/orders/${orderID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { ok: false, reason: 'order not found' };
  const order = await res.json();
  if (order.status !== 'COMPLETED') return { ok: false, reason: 'order not completed' };
  const unit = (order.purchase_units || [])[0] || {};
  const cap = (((unit.payments || {}).captures) || [])[0] || {};
  const amount = parseFloat((cap.amount || unit.amount || {}).value || '0');
  const currency = ((cap.amount || unit.amount || {}).currency_code) || '';
  if (currency !== 'USD' || amount + 1e-6 < minAmount) return { ok: false, reason: 'amount mismatch' };
  return { ok: true, amount };
}

function sanitizeSlug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

function randomKey(len = 24) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function cleanPhone(cc, phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const code = String(cc || '').replace(/\D/g, '');
  return code + digits;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

module.exports = {
  DYNAMIC_PRICE, TERM_DAYS,
  redis, redisPipeline, getLink, reserveLink, saveLink, claimOrder,
  verifyPaypalOrder, sanitizeSlug, randomKey, cleanPhone, send,
};
