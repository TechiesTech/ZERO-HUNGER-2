import { Router } from 'express';
import {
    createOrder,
    trackOrder,
    trackMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    updateDeliveryDetails,
} from '../controllers/orderController.js';
import {
    createOrderSchema,
    trackOrderSchema,
    trackMyOrdersSchema,
    getAllOrdersSchema,
    orderIdParamSchema,
    updateOrderStatusSchema,
    updateDeliveryDetailsSchema,
} from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/createOrder', validate(createOrderSchema), createOrder);
router.post('/trackOrder', validate(trackOrderSchema), trackOrder);
router.post('/trackMyOrders', validate(trackMyOrdersSchema), trackMyOrders);
router.patch('/updateDeliveryDetails', validate(updateDeliveryDetailsSchema), updateDeliveryDetails);
router.get('/getAllOrders', validate(getAllOrdersSchema, 'query'), getAllOrders);
router.get('/getOrderById/:orderId', validate(orderIdParamSchema, 'params'), getOrderById);
router.patch(
    '/updateOrderStatus/:orderId',
    validate(orderIdParamSchema, 'params'),
    validate(updateOrderStatusSchema),
    updateOrderStatus
);
router.delete('/deleteOrder/:orderId', validate(orderIdParamSchema, 'params'), deleteOrder);

export default router;
