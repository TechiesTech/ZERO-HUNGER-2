/**
 * Global centralized error handling middleware.
 * Formats errors consistently for the client and handles:
 * - AppError (custom operational errors)
 * - MongoDB duplicate key errors (code 11000)
 * - Mongoose Validation and Cast errors
 * - Malformed JSON payloads
 * - Unexpected 500 internal server errors
 */
export const errorHandler = (err, _req, res, _next) => {
  // 1. MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';

    let message = `A record with this ${field} already exists`;
    if (field === 'mealSlug') message = 'A meal with this slug already exists';
    if (field === 'orderNumber') message = 'An order with this order number already exists';
    if (field === 'email') message = 'A user with this email already exists';

    return res.status(409).json({
      success: false,
      message,
    });
  }

  // 2. Mongoose Schema Validation Error
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // 3. Mongoose Invalid ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for '${err.path}': ${err.value}`,
    });
  }

  // 4. Malformed JSON Payload in Request Body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body',
    });
  }

  // 5. AppError or General HTTP Error
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? 'Something went wrong' : err.message;

  if (statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors?.length ? { errors: err.errors } : {}),
  });
};

export default errorHandler;