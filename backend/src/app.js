import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mealRoutes from './routes/mealRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import { adminRouter } from './routes/adminRoutes.js';

const app = express();

app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS Configuration with credentials enabled
const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL]
  .filter(Boolean)
  .flatMap((url) => url.split(',').map((origin) => origin.trim()));

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174');
}
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError('Blocked by CORS', 403));
    },
    credentials: true,
  })
);

app.use(cookieParser());

// Body Parsers with payload size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health Check Endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// API Routes
app.use('/api/meals', mealRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRouter);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;