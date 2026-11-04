import bcrypt from 'bcryptjs';
import AppError from '../utils/appError.js';
import * as authRepository from '../repositories/authRepository.js';
import * as kitchenRepository from '../repositories/kitchenRepository.js';

const createKitchen = async ({ password, ...rest }) => {
    const passwordHash = await bcrypt.hash(password, 12);
    try {
        return await authRepository.createKitchen({ ...rest, passwordHash });
    } catch (error) {
        if (error.code === 11000) throw new AppError('A kitchen with this email already exists', 409);
        throw error;
    }
};

const getPaidOrders = (kitchenId) => kitchenRepository.findOrdersForKitchen(kitchenId);

const startPreparing = async (orderId, kitchenId) => {
    const order = await kitchenRepository.moveOrderStatus(orderId, kitchenId, 'confirmed', 'preparing', 'preparingAt');
    if (!order) throw new AppError('Order not found or not waiting for the kitchen', 404);
    return order;
};

const markReady = async (orderId, kitchenId) => {
    const order = await kitchenRepository.moveOrderStatus(orderId, kitchenId, 'preparing', 'readyforpickup', 'readyAt');
    if (!order) throw new AppError('Order not found or not being prepared', 404);
    return order;
};

export { createKitchen, getPaidOrders, startPreparing, markReady };