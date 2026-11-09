import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
import validate from '../middleware/validate.js';
import { orderIdParamSchema } from '../validators/orderValidator.js';
import { createKitchenSchema, getAllKitchensSchema } from '../validators/kitchenValidator.js';
import { createKitchen, getPaidOrders, startPreparing, markReady, getAllKitchens, getActiveKitchens } from '../controllers/kitchenController.js';

const router = Router();

// Admin only: create a kitchen login
router.post('/createKitchen', authenticate, requireRoles('admin'), validate(createKitchenSchema), createKitchen);
router.get('/getAllKitchens', authenticate, requireRoles('admin'), validate(getAllKitchensSchema, 'query'), getAllKitchens);
router.get('/getActiveKitchens', getActiveKitchens);

// Kitchen only
router.get('/getPaidOrders', authenticate, requireRoles('kitchen'), getPaidOrders);
router.patch('/startPreparing/:orderId', authenticate, requireRoles('kitchen'), validate(orderIdParamSchema, 'params'), startPreparing);
router.patch('/markReady/:orderId', authenticate, requireRoles('kitchen'), validate(orderIdParamSchema, 'params'), markReady);

export default router;