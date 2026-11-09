import express from 'express';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
import validate from '../middleware/validate.js';
import { createUserSchema } from '../validators/userValidator.js';
import {
    findById,
    createUser,
    deleteUser,
    setStatus,
    setPassword,
    updateProfile,
} from '../controllers/userController.js';

const router = express.Router();

router.patch('/me', authenticate, updateProfile);

router.post('/createUser', authenticate, requireRoles('admin'), validate(createUserSchema), createUser);
router.get('/getById/:id', authenticate, requireRoles('admin'), findById);
router.delete('deleteById/:id', authenticate, requireRoles('admin'), deleteUser);
router.patch('/:id/status', authenticate, requireRoles('admin'), setStatus);
router.patch('/:id/password', authenticate, requireRoles('admin'), setPassword);

export default router;