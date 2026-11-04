import { Router } from 'express';
import requireRole from '../middleware/requireRole.js';
import validate from '../middleware/validate.js';
import { orderIdParamSchema } from '../validators/orderValidator.js';
import { createKitchenSchema, getAllKitchensSchema } from '../validators/kitchenValidator.js';
import { createKitchen, getPaidOrders, startPreparing, markReady, getAllKitchens } from '../controllers/kitchenController.js';

const router = Router();

// Admin only: create a kitchen login
router.post('/createKitchen', requireRole('admin'), validate(createKitchenSchema), createKitchen);
router.get('/getAllKitchens', requireRole('admin'), validate(getAllKitchensSchema, 'query'), getAllKitchens);

// Kitchen only
router.get('/getPaidOrders', requireRole('kitchen'), getPaidOrders);
router.patch('/startPreparing/:orderId', requireRole('kitchen'), validate(orderIdParamSchema, 'params'), startPreparing);
router.patch('/markReady/:orderId', requireRole('kitchen'), validate(orderIdParamSchema, 'params'), markReady);

export default router;