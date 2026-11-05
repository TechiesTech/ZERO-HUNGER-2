import { Router } from 'express';
import {
    createOrder,
    trackOrder,
    trackMyOrders,
    cancelOrder,
    getAllOrders,
    getOrderById,
    getOrderStats,
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
    assignRiderSchema,
    updateDeliveryDetailsSchema,
} from '../validators/orderValidator.js';
import { assignRider, unassignRider } from '../controllers/deliveryController.js';
import validate from '../middleware/validate.js';
import requireRole from '../middleware/requireRole.js';
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

// Admin endpoints (admin role only)
router.get('/getAllOrders', requireRole('admin'), validate(getAllOrdersSchema, 'query'), getAllOrders);
router.get('/getOrderById/:orderId', requireRole('admin'), validate(orderIdParamSchema, 'params'), getOrderById);
router.get('/getOrderStats', requireRole('admin'), getOrderStats);
router.patch('/assignRider/:orderId', requireRole('admin'), validate(orderIdParamSchema, 'params'), validate(assignRiderSchema), assignRider);
router.patch('/unassignRider/:orderId', requireRole('admin'), validate(orderIdParamSchema, 'params'), unassignRider);
router.delete('/deleteOrder/:orderId', requireRole('admin'), validate(orderIdParamSchema, 'params'), deleteOrder);

export default router;