/**
 * 404 Not Found middleware.
 * Catches all requests that do not match any defined API routes.
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export default notFoundHandler;

