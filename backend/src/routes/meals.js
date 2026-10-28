/**
 * backend/src/routes/meals.js
 * TODO: Mount CRUD routes for the Meal catalogue.
 *
 * GET    /api/meals         → list all available meals
 * GET    /api/meals/:id     → get single meal
 * POST   /api/meals         → create meal (admin only)
 * PATCH  /api/meals/:id     → update meal (admin only)
 * DELETE /api/meals/:id     → archive meal (admin only)
 */
import { Router } from 'express';
const router = Router();
// TODO: mount controller handlers
export { router as mealsRouter };
