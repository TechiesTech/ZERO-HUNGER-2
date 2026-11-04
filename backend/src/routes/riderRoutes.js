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
import requireRole from '../middleware/requireRole.js';
import riderAuth from '../middleware/riderAuth.js';
import uploadImage from '../middleware/uploadImage.js';
import { orderIdParamSchema } from '../validators/orderValidator.js';
import {
    getMyActiveOrder,
    acceptOrder,
    rejectOrder,
    markPickedUp,
    uploadDeliveryPhoto,
    markDelivered,
} from '../controllers/deliveryController.js';

const router = Router();

// Admin only
router.post('/createRider', requireRole('admin'), validate(createRiderSchema), createRider);
router.patch('/updateRider/:riderId', requireRole('admin'), validate(riderIdParamSchema, 'params'), validate(updateRiderSchema), updateRider);
router.get('/getAllRiders', requireRole('admin'), validate(getAllRidersSchema, 'query'), getAllRiders);
router.get('/getRiderById/:riderId', requireRole('admin'), validate(riderIdParamSchema, 'params'), getRiderById);
router.delete('/deleteRider/:riderId', requireRole('admin'), validate(riderIdParamSchema, 'params'), deleteRider);
router.patch('/setRiderPassword/:riderId', requireRole('admin'), validate(riderIdParamSchema, 'params'), validate(setRiderPasswordSchema), setRiderPassword);

// Rider only
router.post('/login', riderLoginLimiter, validate(riderLoginSchema), login);
router.post('/logout', riderAuth, logout);
router.get('/me', riderAuth, getMe);
router.patch('/updateRiderLocation', riderAuth, riderLocationLimiter, validate(updateRiderLocationSchema), updateMyLocation);
router.get('/myActiveOrder', riderAuth, getMyActiveOrder);
router.patch('/acceptOrder/:orderId', riderAuth, validate(orderIdParamSchema, 'params'), acceptOrder);
router.patch('/rejectOrder/:orderId', riderAuth, validate(orderIdParamSchema, 'params'), rejectOrder);
router.patch('/markPickedUp/:orderId', riderAuth, validate(orderIdParamSchema, 'params'), markPickedUp);
router.post('/uploadDeliveryPhoto/:orderId', riderAuth, validate(orderIdParamSchema, 'params'), uploadImage, uploadDeliveryPhoto);
router.patch('/markDelivered/:orderId', riderAuth, validate(orderIdParamSchema, 'params'), markDelivered);
export default router;