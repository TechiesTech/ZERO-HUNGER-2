/**
 * backend/src/middleware/errorHandler.js
 * Centralised Express error handler.
 * Must have 4 parameters for Express to recognise it as an error handler.
 */
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
}
