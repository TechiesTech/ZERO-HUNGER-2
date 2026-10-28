import express from 'express';
import cors from 'cors';
import 'dotenv/config';

/**
 * Zero Hunger — Express Application
 *
 * This file creates and configures the Express app.
 * Routes, middleware, and socket setup will be imported here as they are built.
 *
 * TODO: Import and mount routers once they are implemented:
 *   import { mealsRouter }    from './routes/meals.js';
 *   import { ordersRouter }   from './routes/orders.js';
 *   import { paymentsRouter } from './routes/payments.js';
 *   import { trackingRouter } from './routes/tracking.js';
 *   import { adminRouter }    from './routes/admin.js';
 *   import { ridersRouter }   from './routes/riders.js';
 *
 * TODO: Import and register error-handling middleware:
 *   import { errorHandler } from './middleware/errorHandler.js';
 *
 * TODO: Add rate-limiting middleware:
 *   import { rateLimiter } from './middleware/rateLimit.js';
 */

const app = express();

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL ?? 'http://localhost:5173',
      process.env.ADMIN_URL  ?? 'http://localhost:5174',
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'zerohunger-api',
    timestamp: new Date().toISOString(),
  });
});

// TODO: Mount feature routers here (see above)

// TODO: Register global error handler last (must have 4 params for Express to recognise it)
// app.use(errorHandler);

export { app };
