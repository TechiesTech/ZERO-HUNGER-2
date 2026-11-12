import { Router } from 'express';
import {
    setAvailability,
    updateLocation,
    getAvailableOrders,
    acceptOrder,
    updateStatus,
    currentDelivery,
    getMyDeliveries,
    getRiderStats,
    getAllRiders,
    reviewRider
} from '../controllers/riderController.js';
import {
    setAvailabilitySchema,
    updateLocationSchema,
    updateStatusSchema,
    getMyDeliveriesSchema,
    getAllRidersSchema,
    orderNumberParamSchema,
    userIdParamSchema,
    reviewRiderSchema
} from '../validators/riderValidator.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
import uploadImage from '../middleware/uploadImage.js';
import { riderLocationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.patch('/setAvailability', authenticate, requireRoles('rider'), validate(setAvailabilitySchema), setAvailability);
router.patch('/updateLocation', authenticate, requireRoles('rider'), riderLocationLimiter, validate(updateLocationSchema), updateLocation);
router.get('/getAvailableOrders', authenticate, requireRoles('rider'), getAvailableOrders);
router.post('/acceptOrder/:orderNumber', authenticate, requireRoles('rider'), validate(orderNumberParamSchema, 'params'), acceptOrder);
router.patch('/updateStatus/:orderNumber', authenticate, requireRoles('rider'), validate(orderNumberParamSchema, 'params'), uploadImage, validate(updateStatusSchema), updateStatus);
router.get('/currentDelivery', authenticate, requireRoles('rider'), currentDelivery);
router.get('/getMyDeliveries', authenticate, requireRoles('rider'), validate(getMyDeliveriesSchema, 'query'), getMyDeliveries);

router.get('/getRiderStats', authenticate, requireRoles('admin'), getRiderStats);
router.get('/getAllRiders', authenticate, requireRoles('admin'), validate(getAllRidersSchema, 'query'), getAllRiders);
router.patch('/reviewRider/:userId', authenticate, requireRoles('admin'), validate(userIdParamSchema, 'params'), validate(reviewRiderSchema), reviewRider);

export default router;