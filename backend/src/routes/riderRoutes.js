import { Router } from 'express';
import {
    createRider,
    updateRider,
    getAllRiders,
    getRiderById,
    deleteRider,
    registerRider,
    reviewRider,
    updateMyLocation,
} from '../controllers/riderController.js';
import {
    createRiderAccountSchema,
    riderIdParamSchema,
    updateRiderLocationSchema,
    updateRiderSchema,
    getAllRidersSchema,
    registerRiderSchema,
    reviewRiderSchema,
} from '../validators/riderValidator.js';
import { riderLocationLimiter, riderRegisterLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
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
router.post('/createRider', authenticate, requireRoles('admin'), validate(createRiderAccountSchema), createRider);
router.patch('/updateRider/:riderId', authenticate, requireRoles('admin'), validate(riderIdParamSchema, 'params'), validate(updateRiderSchema), updateRider);
router.get('/getAllRiders', authenticate, requireRoles('admin'), validate(getAllRidersSchema, 'query'), getAllRiders);
router.get('/getRiderById/:riderId', authenticate, requireRoles('admin'), validate(riderIdParamSchema, 'params'), getRiderById);
router.delete('/deleteRider/:riderId', authenticate, requireRoles('admin'), validate(riderIdParamSchema, 'params'), deleteRider);
router.post('/register', riderRegisterLimiter, validate(registerRiderSchema), registerRider);
router.patch('/updateRiderLocation', authenticate, requireRoles('rider'), riderLocationLimiter, validate(updateRiderLocationSchema), updateMyLocation);
router.get('/myActiveOrder', authenticate, requireRoles('rider'), getMyActiveOrder);
router.patch('/acceptOrder/:orderId', authenticate, requireRoles('rider'), validate(orderIdParamSchema, 'params'), acceptOrder);
router.patch('/rejectOrder/:orderId', authenticate, requireRoles('rider'), validate(orderIdParamSchema, 'params'), rejectOrder);
router.patch('/markPickedUp/:orderId', authenticate, requireRoles('rider'), validate(orderIdParamSchema, 'params'), markPickedUp);
router.post('/uploadDeliveryPhoto/:orderId', authenticate, requireRoles('rider'), validate(orderIdParamSchema, 'params'), uploadImage, uploadDeliveryPhoto);
router.patch('/markDelivered/:orderId', authenticate, requireRoles('rider'), validate(orderIdParamSchema, 'params'), markDelivered);

router.patch('/reviewRider/:riderId', authenticate, requireRoles('admin'), validate(riderIdParamSchema, 'params'), validate(reviewRiderSchema), reviewRider);
export default router;