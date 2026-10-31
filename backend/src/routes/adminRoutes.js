import { Router } from 'express';
import validate from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';
import { loginSchema } from '../validators/adminValidator.js';
import { login, logout, getMe } from '../controllers/adminController.js';

const router = Router();

router.post('/login', adminLoginLimiter, validate(loginSchema), login);
router.post('/logout', adminAuth, logout);
router.get('/me', adminAuth, getMe);

export { router as adminRouter };