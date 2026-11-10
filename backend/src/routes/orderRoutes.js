import { Router } from 'express';
import {
    createOrder,
    getCheckoutDetails,
    getMyOrders,
    reverseGeocode,
    trackLiveOrder,
    cancelOrder,
    updateDeliveryDetails,
    getAllOrders,
    getOrderById,
    getOrderStats,
} from '../controllers/orderController.js';
import {
    createOrderSchema,
    getMyOrdersSchema,
    orderNumberParamSchema,
    updateDeliveryDetailsSchema,
    getAllOrdersSchema,
    orderIdParamSchema,
    reverseGeocodeSchema,
} from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
import {
    createOrderLimiter,
    reverseGeocodeLimiter,
    trackLiveOrderLimiter,
    updateOrderLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

// Customer endpoints (login required, the customer is read from the login cookie)
router.get('/checkoutDetails', authenticate, requireRoles('customer'), getCheckoutDetails);
router.post('/createOrder', createOrderLimiter, authenticate, requireRoles('customer'), validate(createOrderSchema), createOrder);
router.get('/getMyOrders', authenticate, requireRoles('customer'), validate(getMyOrdersSchema, 'query'), getMyOrders);
router.get('/trackLiveOrder/:orderNumber', trackLiveOrderLimiter, authenticate, requireRoles('customer'), validate(orderNumberParamSchema, 'params'), trackLiveOrder);
router.patch('/updateDeliveryDetails/:orderNumber', updateOrderLimiter, authenticate, requireRoles('customer'), validate(orderNumberParamSchema, 'params'), validate(updateDeliveryDetailsSchema), updateDeliveryDetails);
router.patch('/cancelOrder/:orderNumber', updateOrderLimiter, authenticate, requireRoles('customer'), validate(orderNumberParamSchema, 'params'), cancelOrder);
router.post('/reverseGeocode', reverseGeocodeLimiter, validate(reverseGeocodeSchema), reverseGeocode);

// Admin endpoints (monitor only, read-only)
router.get('/getAllOrders', authenticate, requireRoles('admin'), validate(getAllOrdersSchema, 'query'), getAllOrders);
router.get('/getOrderById/:orderId', authenticate, requireRoles('admin'), validate(orderIdParamSchema, 'params'), getOrderById);
router.get('/getOrderStats', authenticate, requireRoles('admin'), getOrderStats);

export default router;