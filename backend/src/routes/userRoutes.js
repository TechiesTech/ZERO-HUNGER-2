import express from 'express';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
import validate from '../middleware/validate.js';
import { createUserSchema } from '../validators/userValidator.js';
import {
    getUserById,
    createUser,
    deleteUser,
    setStatus,
    updateProfile,
} from '../controllers/userController.js';

const router = express.Router();

router.patch('/updateProfile', authenticate, updateProfile);

router.post('/createUser', authenticate, requireRoles('admin'), validate(createUserSchema), createUser);
router.get('/getUserById/:id', authenticate, requireRoles('admin'), getUserById);
router.delete('/deleteUserById/:id', authenticate, requireRoles('admin'), deleteUser);
router.patch('/status/:id', authenticate, requireRoles('admin'), setStatus);

export default router;