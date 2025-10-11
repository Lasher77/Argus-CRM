const { ZodError } = require('zod');

class ApiError extends Error {
  constructor(statusCode, message, { code = 'UNSPECIFIED_ERROR', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static from(error, defaults = {}) {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof ZodError) {
      return ApiError.fromZod(error, defaults);
    }

    const statusCode = defaults.statusCode || 500;
    const code = defaults.code || 'INTERNAL_SERVER_ERROR';
    const message = defaults.message || 'Interner Serverfehler';

    return new ApiError(statusCode, message, { code, details: defaults.details });
  }

  static fromZod(error, defaults = {}) {
    const statusCode = defaults.statusCode || 400;
    const code = defaults.code || 'VALIDATION_ERROR';
    const message = defaults.message || 'Die Anfrage enthält ungültige Daten';

    const details = error.issues?.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));

    return new ApiError(statusCode, message, { code, details });
  }
}

const createErrorResponse = ({ code, message, details }) => ({
  success: false,
  error: {
    code,
    message,
    ...(details ? { details } : {})
  }
});

module.exports = {
  ApiError,
  createErrorResponse
};
