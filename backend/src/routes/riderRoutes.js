import { Router } from 'express';
import { createRider, updateRider, getAllRiders, getRiderById, deleteRider } from '../controllers/riderController.js';
import { login, logout, getMe, updateMyLocation, setRiderPassword } from '../controllers/riderAuthController.js';
import {
    createRiderSchema,
    riderIdParamSchema,
    updateRiderLocationSchema,
    updateRiderSchema,
    getAllRidersSchema,
} from '../validators/riderValidator.js';
import { riderLoginSchema, setRiderPasswordSchema } from '../validators/riderAuthValidator.js';
import { riderLoginLimiter, riderLocationLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';
import riderAuth from '../middleware/riderAuth.js';

const router = Router();

router.post('/createRider', adminAuth, validate(createRiderSchema), createRider);
router.patch('/updateRider/:riderId', adminAuth, validate(riderIdParamSchema, 'params'), validate(updateRiderSchema), updateRider);
router.get('/getAllRiders', adminAuth, validate(getAllRidersSchema, 'query'), getAllRiders);
router.get('/getRiderById/:riderId', adminAuth, validate(riderIdParamSchema, 'params'), getRiderById);
router.delete('/deleteRider/:riderId', adminAuth, validate(riderIdParamSchema, 'params'), deleteRider);
router.patch('/setRiderPassword/:riderId', adminAuth, validate(riderIdParamSchema, 'params'), validate(setRiderPasswordSchema), setRiderPassword);

router.post('/login', riderLoginLimiter, validate(riderLoginSchema), login);
router.post('/logout', riderAuth, logout);
router.get('/me', riderAuth, getMe);
router.patch('/updateRiderLocation', riderAuth, riderLocationLimiter, validate(updateRiderLocationSchema), updateMyLocation);

export default router;