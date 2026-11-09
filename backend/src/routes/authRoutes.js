import { Router } from 'express';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import {
    loginIpLimiter, loginAccountLimiter, registerLimiter, codeIpLimiter,
    codeEmailLimiter, verifyCodeLimiter, changePasswordLimiter,
} from '../middleware/rateLimiter.js';
import {
    loginSchema, registerSchema, changePasswordSchema, emailSchema, verifyEmailSchema, resetPasswordSchema,
} from '../validators/authValidator.js';
import {
    login, register, verifyEmail, resendCode, logout, getMe, changePassword, forgotPassword, resetPassword,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', loginIpLimiter, validate(loginSchema), loginAccountLimiter, login);
router.post('/register', registerLimiter, validate(registerSchema), codeEmailLimiter, register);
router.post('/verifyEmail', verifyCodeLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/resendCode', codeIpLimiter, validate(emailSchema), codeEmailLimiter, resendCode);
router.post('/forgotPassword', codeIpLimiter, validate(emailSchema), codeEmailLimiter, forgotPassword);
router.post('/resetPassword', verifyCodeLimiter, validate(resetPasswordSchema), resetPassword);

router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.patch('/changePassword', authenticate, changePasswordLimiter, validate(changePasswordSchema), changePassword);

export { router as authRouter };