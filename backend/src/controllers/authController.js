// Controllers: read the request, call the service, send the response. No business logic here.
// (Express 5 passes errors from async functions to the error handler automatically.)
const authService = require('../services/authService');

async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json({ data: result });
}

async function login(req, res) {
  const result = await authService.login(req.body);
  res.json({ data: result });
}

// JWTs are stateless: the server keeps no session, so logging out means the
// browser deletes its token. This endpoint exists so the API is complete.
function logout(req, res) {
  res.status(204).end();
}

async function me(req, res) {
  res.json({ data: await authService.getMe(req.user.id) });
}

module.exports = { register, login, logout, me };
