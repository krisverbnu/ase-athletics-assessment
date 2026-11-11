// The single place where errors become responses.
// Every error, whether thrown by us or by a library, ends up here and leaves in the
// same format:  { "error": { "message": "...", "details": [...] } }
const HttpError = require('../utils/httpError');

function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;
  let details = err.details;

  // Translate common Prisma (database) errors into friendly HTTP errors
  if (err.code === 'P2025') {
    status = 404;
    message = 'Record not found.';
  } else if (err.code === 'P2002') {
    status = 409;
    message = `That ${err.meta?.target?.join?.(', ') || 'value'} is already taken.`;
  } else if (err.code === 'P2003') {
    status = 400;
    message = 'A related record does not exist.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  }

  if (status >= 500) {
    console.error(err); // log the real problem for us...
    message = 'Something went wrong on our side. Please try again.'; // ...but don't leak it to users
    details = undefined;
  }

  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}

module.exports = { notFound, errorHandler };
