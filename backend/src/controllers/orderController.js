import * as orderService from '../services/orderService.js';

const createOrder = async (req, res, next) => {
    try {
        const data = await orderService.createOrder(req.user, req.body);
        return res.status(201).json({ success: true, message: 'Order created successfully', data });
    } catch (error) {
        return next(error);
    }
};

const getCheckoutDetails = async (req, res, next) => {
    try {
        const data = await orderService.getCheckoutDetails(req.user);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getMyOrders = async (req, res, next) => {
    try {
        const data = await orderService.getMyOrders(req.user, req.validatedQuery);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const reverseGeocode = async (req, res, next) => {
    try {
        const address = await orderService.reverseGeocode(req.body);
        return res.status(200).json({ success: true, data: { address } });
    } catch (error) {
        return next(error);
    }
};

const trackLiveOrder = async (req, res, next) => {
    try {
        const data = await orderService.trackLiveOrder(req.user, req.params.orderNumber);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const data = await orderService.cancelOrder(req.user, req.params.orderNumber);
        return res.status(200).json({ success: true, message: 'Order cancelled successfully', data });
    } catch (error) {
        return next(error);
    }
};

const updateDeliveryDetails = async (req, res, next) => {
    try {
        const data = await orderService.updateDeliveryDetails(req.user, req.params.orderNumber, req.body);
        return res.status(200).json({ success: true, message: 'Delivery details updated successfully', data });
    } catch (error) {
        return next(error);
    }
};

const getAllOrders = async (req, res, next) => {
    try {
        const data = await orderService.getAllOrders(req.validatedQuery);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const data = await orderService.getOrderById(req.params.orderId);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getOrderStats = async (_req, res, next) => {
    try {
        const data = await orderService.getOrderStats();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export {
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
};