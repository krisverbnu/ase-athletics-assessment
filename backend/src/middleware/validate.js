// Runs a Joi schema against part of the request before the controller sees it.
// Bad input is stopped here with a 400 and a list of what's wrong.
//
// Usage in a route:  validate(playerSchema)            -> checks req.body
//                    validate(listSchema, 'query')     -> checks req.query
const HttpError = require('../utils/httpError');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false, // report every problem, not just the first
      stripUnknown: true, // silently drop fields we don't expect
      convert: true, // "25" in a URL becomes the number 25
    });

    if (error) {
      const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
      return next(new HttpError(400, 'Some fields are invalid.', details));
    }

    // Express 5 makes req.query read-only, so cleaned values live in req.validated
    req.validated = { ...req.validated, [source]: value };
    if (source === 'body') req.body = value;
    return next();
  };
}

module.exports = validate;
