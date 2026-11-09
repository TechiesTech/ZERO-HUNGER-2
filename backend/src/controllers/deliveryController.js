import * as deliveryService from '../services/deliveryService.js';

const assignRider = async (req, res, next) => {
    try {
        const data = await deliveryService.assignRider(req.params.orderId, req.body.riderId);
        return res.status(200).json({ success: true, message: 'Rider assigned', data });
    } catch (error) {
        return next(error);
    }
};

const unassignRider = async (req, res, next) => {
    try {
        const data = await deliveryService.releaseRider(req.params.orderId, null);
        return res.status(200).json({ success: true, message: 'Rider removed from the order', data });
    } catch (error) {
        return next(error);
    }
};

const getMyActiveOrder = async (req, res, next) => {
    try {
        const data = await deliveryService.getMyActiveOrder(String(req.user._id));
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const acceptOrder = async (req, res, next) => {
    try {
        const data = await deliveryService.acceptOrder(req.params.orderId, req.user._id);
        return res.status(200).json({ success: true, message: 'Order accepted', data });
    } catch (error) {
        return next(error);
    }
};

const rejectOrder = async (req, res, next) => {
    try {
        const data = await deliveryService.releaseRider(req.params.orderId, req.user._id);
        return res.status(200).json({ success: true, message: 'Order rejected', data });
    } catch (error) {
        return next(error);
    }
};

const markPickedUp = async (req, res, next) => {
    try {
        const data = await deliveryService.markPickedUp(req.params.orderId, req.user._id);
        return res.status(200).json({ success: true, message: 'Order picked up', data });
    } catch (error) {
        return next(error);
    }
};

const uploadDeliveryPhoto = async (req, res, next) => {
    try {
        const data = await deliveryService.uploadDeliveryPhoto(req.file, req.params.orderId, req.user._id);
        return res.status(201).json({ success: true, message: 'Delivery photo saved', data });
    } catch (error) {
        return next(error);
    }
};

const markDelivered = async (req, res, next) => {
    try {
        const data = await deliveryService.markDelivered(req.params.orderId, req.user._id);
        return res.status(200).json({ success: true, message: 'Order delivered', data });
    } catch (error) {
        return next(error);
    }
};

export {
    assignRider,
    unassignRider,
    getMyActiveOrder,
    acceptOrder,
    rejectOrder,
    markPickedUp,
    uploadDeliveryPhoto,
    markDelivered,
};
