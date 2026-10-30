import { Router } from 'express';
import { createOrder, trackOrder } from '../controllers/orderController.js';
import { createOrderSchema, trackOrderSchema } from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/createOrder', validate(createOrderSchema), createOrder);
router.post('/trackOrder', validate(trackOrderSchema), trackOrder);

export default router;
