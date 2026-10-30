import { Router } from 'express';
import { createOrder, trackOrder, trackMyOrders, getAllOrders, getOrderById } from '../controllers/orderController.js';
import { createOrderSchema, trackOrderSchema, trackMyOrdersSchema, getAllOrdersSchema, orderIdParamSchema } from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/createOrder', validate(createOrderSchema), createOrder);
router.post('/trackOrder', validate(trackOrderSchema), trackOrder);
router.post('/trackMyOrders', validate(trackMyOrdersSchema), trackMyOrders);
router.get('/getAllOrders', validate(getAllOrdersSchema, 'query'), getAllOrders);
router.get('/getOrderById/:orderId', validate(orderIdParamSchema, 'params'), getOrderById);


export default router;
