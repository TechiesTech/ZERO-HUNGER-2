/**
 * backend/src/routes/admin.js
 * TODO: Mount admin-only routes (stats, overrides).
 *
 * TODO (auth): Protect all routes in this file with an admin auth middleware.
 *   router.use(requireAdminAuth);
 *
 * GET  /api/admin/stats        → dashboard summary numbers
 * GET  /api/admin/deliveries   → all deliveries overview
 * GET  /api/admin/users        → list registered customers
 */
import { Router } from 'express';
const router = Router();
// TODO: mount controller handlers
export { router as adminRouter };
