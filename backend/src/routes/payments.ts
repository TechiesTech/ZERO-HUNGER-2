/**
 * backend/src/routes/payments.ts
 * TODO: Mount Razorpay payment routes.
 *
 * POST /api/payments/create-order  → create Razorpay order
 * POST /api/payments/verify        → verify payment signature
 * POST /api/payments/webhook       → Razorpay webhook handler
 */
import { Router } from 'express';
const router = Router();
// TODO: mount controller handlers
export { router as paymentsRouter };
