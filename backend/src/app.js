import express from 'express';
import mealRoutes from './routes/mealRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

const errorHandler = (err, _req, res, _next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A meal with this slug already exists',
    });
  }

  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Something went wrong' : err.message;

  if (statusCode === 500) console.error(err);

  return res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors?.length && { errors: err.errors }),
  });
};

const notFoundHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use('/api/meals', mealRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;