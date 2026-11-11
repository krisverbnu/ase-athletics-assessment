// Protects routes: only requests carrying a valid login token (JWT) get through.
// The frontend sends it as a header:  Authorization: Bearer <token>
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/httpError');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Please log in to continue.'));
  }

  try {
    // verify() checks the signature (it was made with our JWT_SECRET) and the expiry date
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch {
    return next(new HttpError(401, 'Your session has expired. Please log in again.'));
  }
}

module.exports = requireAuth;
