// Rate limiting: slows down password guessing and bots creating accounts.
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Render sits behind proxies and doesn't document how many, so the visitor's IP is a
// best guess: the CDN's client-IP header if present, otherwise the first address in
// X-Forwarded-For, otherwise the connection. If that guess is wrong, the worst case is
// a weaker limit, never every visitor sharing one limit and locking each other out.
function visitorIp(req) {
  const forwarded = req.headers['x-forwarded-for']?.split(',')[0].trim();
  return req.headers['true-client-ip'] || req.headers['cf-connecting-ip'] || forwarded || req.ip;
}

// Same JSON error shape as every other API error, so the forms show it normally
const tooMany = (message) => (req, res) => res.status(429).json({ error: { message } });

const shared = {
  standardHeaders: 'draft-8', // tells clients how long to wait (RateLimit headers)
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // we read the header ourselves (see above)
};

// Login: 10 wrong passwords per email address per 15 minutes. Counting per account
// (not per IP) protects each account even if an attacker keeps changing IP address.
// Successful logins don't count, so normal use is never affected.
const loginLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login:${String(req.body?.email || '').trim().toLowerCase() || ipKeyGenerator(visitorIp(req))}`,
  handler: tooMany('Too many failed attempts for this account. Please wait 15 minutes and try again.'),
});

// Sign-up: 5 new accounts per visitor per hour
const registerLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => `register:${ipKeyGenerator(visitorIp(req))}`,
  handler: tooMany('Too many sign-ups from this connection. Please try again in an hour.'),
});

module.exports = { loginLimiter, registerLimiter };
