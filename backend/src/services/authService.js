// Register, login and "who am I" logic
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const HttpError = require('../utils/httpError');

const SALT_ROUNDS = 10; // how slow the hash is on purpose: slower = harder to crack
const TOKEN_LIFETIME = '1d';

// Never send the password hash back to the browser
const publicUser = (user) => ({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });

function createToken(user) {
  // The token says who you are ("sub" = subject) and is signed with our secret,
  // so nobody can edit it without us noticing
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_LIFETIME,
  });
}

// Optional: only let people with certain email domains sign up, e.g.
// ALLOWED_EMAIL_DOMAINS=aseathletics.com. Empty (the default) means anyone can register,
// which is how the assessment demo runs so reviewers can create accounts.
function allowedDomains() {
  return (process.env.ALLOWED_EMAIL_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

async function register({ name, email, password }) {
  const domains = allowedDomains();
  const domain = email.split('@').pop().toLowerCase();
  if (domains.length && !domains.includes(domain)) {
    const message = `Sign-up is limited to ${domains.map((d) => '@' + d).join(', ')} email addresses.`;
    throw new HttpError(403, message, [{ field: 'email', message }]);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  return { user: publicUser(user), token: createToken(user) };
}

// fake hash made once at startup, used when the email doesn't exist
// so login takes the same time whether the account is real or not
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), SALT_ROUNDS);

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  // same message for wrong email and wrong password so nobody can tell which emails have accounts
  // always run bcrypt too, otherwise unknown emails answer faster and the timing gives it away
  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Incorrect email or password.');
  return { user: publicUser(user), token: createToken(user) };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(401, 'Account no longer exists.');
  return publicUser(user);
}

module.exports = { register, login, getMe };
