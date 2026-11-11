// Shared test helpers: a valid login token for a given user
const jwt = require('jsonwebtoken');

const authAs = (user) => ({
  Authorization: `Bearer ${jwt.sign({ sub: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET)}`,
});

module.exports = { authAs };
