import * as kitchenService from '../services/kitchenService.js';

const createKitchen = async (req, res, next) => {
    try {
        const data = await kitchenService.createKitchen(req.body);
        return res.status(201).json({ success: true, message: 'Kitchen created', data });
    } catch (error) {
        return next(error);
    }
};

const getAllKitchens = async (req, res, next) => {
    try {
        const data = await kitchenService.getAllKitchens(req.validatedQuery);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getActiveKitchens = async (_req, res, next) => {
    try {
        const data = await kitchenService.getActiveKitchens();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getPaidOrders = async (req, res, next) => {
    try {
        const data = await kitchenService.getPaidOrders(req.user._id);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const startPreparing = async (req, res, next) => {
    try {
        const data = await kitchenService.startPreparing(req.params.orderId, req.user._id);
        return res.status(200).json({ success: true, message: 'Order is being prepared', data });
    } catch (error) {
        return next(error);
    }
};

const markReady = async (req, res, next) => {
    try {
        const data = await kitchenService.markReady(req.params.orderId, req.user._id);
        return res.status(200).json({ success: true, message: 'Order is ready for pickup', data });
    } catch (error) {
        return next(error);
    }
};

export { createKitchen, getAllKitchens, getActiveKitchens, getPaidOrders, startPreparing, markReady };