import { Router } from 'express';
import { createOrder } from '../controllers/orderController.js';
import { createOrderSchema } from '../validators/orderValidate.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/createOrder', validate(createOrderSchema), createOrder);

export default router;