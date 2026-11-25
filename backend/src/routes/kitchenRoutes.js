import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
import validate from '../middleware/validate.js';
import { orderIdParamSchema } from '../validators/orderValidator.js';
import { kitchenDetailsSchema, getAllKitchensSchema, kitchenIdParamSchema, setServiceRadiusSchema } from '../validators/kitchenValidator.js';
import {
    getMyKitchen,
    saveMyKitchen,
    setServiceRadius,
    getPaidOrders,
    startPreparing,
    markReady,
    getAllKitchens,
    getActiveKitchens,
} from '../controllers/kitchenController.js';

const router = Router();

// Admin only
router.get('/getAllKitchens', authenticate, requireRoles('admin'), validate(getAllKitchensSchema, 'query'), getAllKitchens);
router.patch('/setServiceRadius/:kitchenId', authenticate, requireRoles('admin'), validate(kitchenIdParamSchema, 'params'), validate(setServiceRadiusSchema), setServiceRadius);

// Public
router.get('/getActiveKitchens', getActiveKitchens);

// Kitchen only: fill or update its own address and location
router.get('/me', authenticate, requireRoles('kitchen'), getMyKitchen);
router.put('/me', authenticate, requireRoles('kitchen'), validate(kitchenDetailsSchema), saveMyKitchen);

// Kitchen only: orders
router.get('/getPaidOrders', authenticate, requireRoles('kitchen'), getPaidOrders);
router.patch('/startPreparing/:orderId', authenticate, requireRoles('kitchen'), validate(orderIdParamSchema, 'params'), startPreparing);
router.patch('/markReady/:orderId', authenticate, requireRoles('kitchen'), validate(orderIdParamSchema, 'params'), markReady);

export default router;