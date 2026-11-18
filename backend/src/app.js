import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mealRoutes from './routes/mealRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import authRoutes from './routes/authRoutes.js';
import AppError from './utils/appError.js';
import kitchenRoutes from './routes/kitchenRoutes.js';
import userRoutes from './routes/userRoutes.js';
import addressRoutes from './routes/addressRoutes.js'

const app = express();

app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS Configuration with credentials enabled
const allowedOrigins = [
  'https://zero-hunger-2-wgmf.vercel.app',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
]
  .filter(Boolean)
  .flatMap((url) => url.split(',').map((origin) => origin.trim()));

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175');
}

// Development-only: accept loopback and private-network hosts (any port) so the
// apps keep working when opened over the LAN, e.g. http://192.168.1.11:5175.
const isLocalDevOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();

    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
      return true;
    }

    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;

    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) {
        return callback(null, true);
      }
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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/addresses', addressRoutes)

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;