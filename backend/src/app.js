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
import { isAllowedOrigin } from './config/origins.js';

const app = express();

app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || isAllowedOrigin(origin)) return callback(null, true);
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