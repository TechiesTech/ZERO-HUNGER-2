import { Router } from 'express';
import {
    createOrder,
    trackOrder,
    trackMyOrders,
    cancelOrder,
    getAllOrders,
    getOrderById,
    getOrderStats,
    updateOrderStatus,
    deleteOrder,
    updateDeliveryDetails,
    trackLiveOrder
} from '../controllers/orderController.js';
import {
    createOrderSchema,
    trackOrderSchema,
    trackMyOrdersSchema,
    cancelOrderSchema,
    getAllOrdersSchema,
    orderIdParamSchema,
    updateOrderStatusSchema,
    updateDeliveryDetailsSchema,
} from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';
import {
    createOrderLimiter,
    trackOrderLimiter,
    trackMyOrdersLimiter,
    updateOrderLimiter,
    trackLiveOrderLimiter
} from '../middleware/rateLimiter.js';

const router = Router();

router.post('/createOrder', createOrderLimiter, validate(createOrderSchema), createOrder);
router.post('/trackOrder', trackOrderLimiter, validate(trackOrderSchema), trackOrder);
router.post('/trackMyOrders', trackMyOrdersLimiter, validate(trackMyOrdersSchema), trackMyOrders);
router.patch('/updateDeliveryDetails', updateOrderLimiter, validate(updateDeliveryDetailsSchema), updateDeliveryDetails);
router.patch('/cancelOrder', updateOrderLimiter, validate(cancelOrderSchema), cancelOrder);

router.get('/getAllOrders', validate(getAllOrdersSchema, 'query'), getAllOrders);
router.get('/getOrderById/:orderId', validate(orderIdParamSchema, 'params'), getOrderById);
router.get('/getOrderStats', getOrderStats);
router.patch(
    '/updateOrderStatus/:orderId',
    validate(orderIdParamSchema, 'params'),
    validate(updateOrderStatusSchema),
    updateOrderStatus
);
router.delete('/deleteOrder/:orderId', validate(orderIdParamSchema, 'params'), deleteOrder);

router.post('/trackLiveOrder', trackLiveOrderLimiter, validate(trackOrderSchema), trackLiveOrder);
export default router;
