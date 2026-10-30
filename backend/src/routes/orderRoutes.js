import { Router } from 'express';
import { createOrder, trackOrder, trackMyOrders } from '../controllers/orderController.js';
import { createOrderSchema, trackOrderSchema, trackMyOrdersSchema } from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/createOrder', validate(createOrderSchema), createOrder);
router.post('/trackOrder', validate(trackOrderSchema), trackOrder);
router.post('/trackMyOrders', validate(trackMyOrdersSchema), trackMyOrders);


export default router;
