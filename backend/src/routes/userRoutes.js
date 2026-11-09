import express from 'express';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
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

router.post('/', authenticate, requireRoles('admin'), createUser);
router.get('/:id', authenticate, requireRoles('admin'), findById);
router.delete('/:id', authenticate, requireRoles('admin'), deleteUser);
router.patch('/:id/status', authenticate, requireRoles('admin'), setStatus);
router.patch('/:id/password', authenticate, requireRoles('admin'), setPassword);

export default router;