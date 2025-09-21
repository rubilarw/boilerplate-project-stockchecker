const crypto = require('crypto');

function normalizeIp(req) {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.ip ||
    req.socket?.remoteAddress;

  if (!ip) return 'unknown';
  if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];
  if (ip === '::1') ip = '127.0.0.1';

  return ip.trim();
}

function anonymizeIP(ip) {
  const salt = process.env.IP_SALT || 'default_salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

module.exports = { normalizeIp, anonymizeIP };
