/**
 * backend/src/routes/riders.js
 * TODO: Mount rider management routes.
 *
 * TODO (auth): Protect mutation routes with admin auth middleware.
 *
 * GET    /api/riders          → list riders
 * POST   /api/riders          → onboard new rider (admin only)
 * GET    /api/riders/:id      → get rider profile + delivery history
 * PATCH  /api/riders/:id      → update rider status (admin / rider self)
 * DELETE /api/riders/:id      → offboard rider (admin only)
 */
import { Router } from 'express';
const router = Router();
// TODO: mount controller handlers
export { router as ridersRouter };
