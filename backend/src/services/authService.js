// Register, login and "who am I" logic
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

async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  return { user: publicUser(user), token: createToken(user) };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Same message whether the email or the password is wrong, so attackers
  // can't use the login form to discover which emails have accounts
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new HttpError(401, 'Incorrect email or password.');
  return { user: publicUser(user), token: createToken(user) };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(401, 'Account no longer exists.');
  return publicUser(user);
}

module.exports = { register, login, getMe };
