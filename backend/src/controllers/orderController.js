import * as orderService from '../services/orderService.js';

const createOrder = async (req, res, next) => {
    try {
        const order = await orderService.createOrder(req.body);
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order,
        });
    } catch (error) {
        next(error);
    }
};
const trackOrder = async (req, res, next) => {
    try {
        const data = await orderService.trackOrder(req.body);

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};
const trackMyOrders = async (req, res, next) => {
    try {
        const data = await orderService.trackMyOrders(req.body);

        return res.status(200).json({ success: true, data });
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
export { createOrder, trackOrder, trackMyOrders, getAllOrders, getOrderById };