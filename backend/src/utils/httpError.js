// An error that carries an HTTP status code, e.g. throw new HttpError(404, 'Player not found').
// The error handler turns it into a clean JSON response.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = HttpError;
