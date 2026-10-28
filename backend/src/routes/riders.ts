/**
 * backend/src/routes/riders.ts
 * TODO: Mount rider management routes.
 *
 * TODO (auth): Protect mutation routes with admin auth middleware.
 *
 * GET    /api/riders          → list riders
 * POST   /api/riders          → onboard new rider (admin)
 * PATCH  /api/riders/:id      → update rider info / availability
 * DELETE /api/riders/:id      → offboard rider (admin)
 */
import { Router } from 'express';
const router = Router();
// TODO (auth): protect mutation routes
// TODO: mount controller handlers
export { router as ridersRouter };
