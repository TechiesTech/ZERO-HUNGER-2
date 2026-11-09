import express from 'express';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
import validate from '../middleware/validate.js';
import {
    registerSchema,
    verifyEmailSchema,
    emailSchema,
    loginSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from '../validators/authValidator.js';
import {
    register,
    verifyEmail,
    resendCode,
    login,
    forgotPassword,
    resetPassword,
    logout,
    getMe,
    changePassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/verifyEmail', validate(verifyEmailSchema), verifyEmail);
router.post('/resendCode', validate(emailSchema), resendCode);
router.post('/login', validate(loginSchema), login);
router.post('/forgotPassword', validate(emailSchema), forgotPassword);
router.post('/resetPassword', validate(resetPasswordSchema), resetPassword);

router.post('/logout', logout);
router.get('/me', authenticate, requireRoles('admin', 'kitchen', 'rider', 'customer'), getMe);
router.post(
    '/changePassword',
    authenticate,
    requireRoles('admin', 'kitchen', 'rider', 'customer'),
    validate(changePasswordSchema),
    changePassword
);

export default router;