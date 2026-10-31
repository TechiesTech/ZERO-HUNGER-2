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
import adminAuth from '../middleware/adminAuth.js';
import {
    createOrderLimiter,
    trackOrderLimiter,
    trackMyOrdersLimiter,
    updateOrderLimiter,
    trackLiveOrderLimiter
} from '../middleware/rateLimiter.js';

const router = Router();

// Customer endpoints
router.post('/createOrder', createOrderLimiter, validate(createOrderSchema), createOrder);
router.post('/trackOrder', trackOrderLimiter, validate(trackOrderSchema), trackOrder);
router.post('/trackMyOrders', trackMyOrdersLimiter, validate(trackMyOrdersSchema), trackMyOrders);
router.patch('/updateDeliveryDetails', updateOrderLimiter, validate(updateDeliveryDetailsSchema), updateDeliveryDetails);
router.patch('/cancelOrder', updateOrderLimiter, validate(cancelOrderSchema), cancelOrder);
router.post('/trackLiveOrder', trackLiveOrderLimiter, validate(trackOrderSchema), trackLiveOrder);

// Admin endpoints (protected by adminAuth)
router.get('/getAllOrders', adminAuth, validate(getAllOrdersSchema, 'query'), getAllOrders);
router.get('/getOrderById/:orderId', adminAuth, validate(orderIdParamSchema, 'params'), getOrderById);
router.get('/getOrderStats', adminAuth, getOrderStats);
router.patch(
    '/updateOrderStatus/:orderId',
    adminAuth,
    validate(orderIdParamSchema, 'params'),
    validate(updateOrderStatusSchema),
    updateOrderStatus
);
router.delete('/deleteOrder/:orderId', adminAuth, validate(orderIdParamSchema, 'params'), deleteOrder);

export default router;
