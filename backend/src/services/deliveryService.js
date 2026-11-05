import AppError from '../utils/appError.js';
import * as deliveryRepository from '../repositories/deliveryRepository.js';

const assignRider = async (orderId, riderId) => {
    try {
        const { rider, order, delivery } = await deliveryRepository.assignRider(orderId, riderId);
        if (!rider) throw new AppError('Rider not found, inactive or off duty', 409);
        if (!order) throw new AppError('Order not found, unpaid, already assigned or already collected', 409);
        return { order, delivery };
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('This rider already has an open delivery, or the order is already assigned', 409);
        }
        throw error;
    }
};

const releaseRider = async (orderId, riderId) => {
    const order = await deliveryRepository.releaseRider(orderId, riderId);
    if (!order) throw new AppError('No open delivery to release, or the order was already collected', 404);
    return order;
};

const getMyActiveOrder = async (riderId) => deliveryRepository.getMyActiveOrder(riderId);

const acceptOrder = async (orderId, riderId) => {
    const delivery = await deliveryRepository.acceptOrder(orderId, riderId);
    if (!delivery) throw new AppError('Order not assigned to you, or already accepted', 404);
    return delivery;
};

const markPickedUp = async (orderId, riderId) => {
    const order = await deliveryRepository.markPickedUp(orderId, riderId);
    if (!order) throw new AppError('Order not accepted by you, or not ready for pickup yet', 404);
    return order;
};

const uploadDeliveryPhoto = async (file, orderId, riderId) => {
    if (!file) throw new AppError('Please take a delivery photo', 400);
    const photo = await deliveryRepository.uploadDeliveryPhoto(file.buffer, orderId, riderId);
    if (!photo) throw new AppError('Order is not out for delivery with you', 404);
    return photo;
};

const markDelivered = async (orderId, riderId) => {
    const order = await deliveryRepository.markDelivered(orderId, riderId);
    if (!order) throw new AppError('Order is not out for delivery with you, or the delivery photo is missing', 404);
    return order;
};

export {
    assignRider,
    releaseRider,
    getMyActiveOrder,
    acceptOrder,
    markPickedUp,
    uploadDeliveryPhoto,
    markDelivered,
};
