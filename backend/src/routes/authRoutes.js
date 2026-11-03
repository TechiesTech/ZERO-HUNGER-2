import { Router } from 'express';
import validate from '../middleware/validate.js';
import requireRole from '../middleware/requireRole.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';
import { loginSchema } from '../validators/authValidator.js';
import { login, logout, getMe } from '../controllers/authController.js';

const router = Router();

router.post('/login', adminLoginLimiter, validate(loginSchema), login);
router.post('/logout', requireRole('admin', 'kitchen'), logout);
router.get('/me', requireRole('admin', 'kitchen'), getMe);

export { router as authRouter };