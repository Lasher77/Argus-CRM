const { ApiError } = require('../utils/apiError');

const validate = (schema, property = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[property]);
    req[property] = parsed;
    return next();
  } catch (error) {
    return next(ApiError.from(error, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Die Anfrage enthält ungültige Daten'
    }));
  }
};

module.exports = {
  validate
};
