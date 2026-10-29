export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal Server Error' : err.message,
    ...(err.errors && { errors: err.errors }),
  });
}