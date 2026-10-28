/**
 * backend/src/routes/admin.ts
 * TODO: Mount admin-only routes (stats, overrides).
 *
 * TODO (auth): Protect all routes in this file with an admin auth middleware.
 *   router.use(requireAdminAuth);
 *
 * GET  /api/admin/stats        → dashboard summary stats
 * GET  /api/admin/orders       → paginated order list
 * GET  /api/admin/tokens       → paginated token list
 */
import { Router } from 'express';
const router = Router();
// TODO (auth): router.use(requireAdminAuth);
// TODO: mount controller handlers
export { router as adminRouter };
