/**
 * backend/src/routes/orders.ts
 * TODO: Mount order management routes.
 *
 * POST  /api/orders           → create new order (triggers payment)
 * GET   /api/orders/:id       → get order status
 * PATCH /api/orders/:id/status → update order status (admin / webhook)
 */
import { Router } from 'express';
const router = Router();
// TODO: mount controller handlers
export { router as ordersRouter };
