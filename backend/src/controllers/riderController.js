import * as riderService from '../services/riderService.js';

const setAvailability = async (req, res, next) => {
    try {
        const data = await riderService.setAvailability(req.user, req.body);
        return res.status(200).json({ success: true, message: 'Availability updated successfully', data });
    } catch (error) {
        return next(error);
    }
};

const updateLocation = async (req, res, next) => {
    try {
        const data = await riderService.updateLocation(req.user, req.body);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getAvailableOrders = async (_req, res, next) => {
    try {
        const data = await riderService.getAvailableOrders();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const acceptOrder = async (req, res, next) => {
    try {
        const data = await riderService.acceptOrder(req.user, req.params.orderNumber);
        return res.status(201).json({ success: true, message: 'Order accepted successfully', data });
    } catch (error) {
        return next(error);
    }
};
const updateStatus = async (req, res, next) => {
    try {
        const data = await riderService.updateStatus(req.user, req.params.orderNumber, req.body, req.file);
        return res.status(200).json({ success: true, message: 'Order status updated successfully', data });
    } catch (error) {
        return next(error);
    }
};
const currentDelivery = async (req, res, next) => {
    try {
        const data = await riderService.currentDelivery(req.user);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getMyDeliveries = async (req, res, next) => {
    try {
        const data = await riderService.getMyDeliveries(req.user, req.validatedQuery);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getRiderStats = async (_req, res, next) => {
    try {
        const data = await riderService.getRiderStats();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getAllRiders = async (req, res, next) => {
    try {
        const data = await riderService.getAllRiders(req.validatedQuery);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const reviewRider = async (req, res, next) => {
    try {
        const data = await riderService.reviewRider(req.params.userId, req.body);
        return res.status(200).json({ success: true, message: 'Rider reviewed successfully', data });
    } catch (error) {
        return next(error);
    }
};

export {
    setAvailability,
    updateLocation,
    getAvailableOrders,
    acceptOrder,
    updateStatus,
    currentDelivery,
    getMyDeliveries,
    getRiderStats,
    getAllRiders,
    reviewRider
};