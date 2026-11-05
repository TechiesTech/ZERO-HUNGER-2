import bcrypt from 'bcryptjs';
import AppError from '../utils/appError.js';
import * as kitchenRepository from '../repositories/kitchenRepository.js';

const createKitchen = async ({ password, ...rest }) => {
    const passwordHash = await bcrypt.hash(password, 12);
    try {
        return await kitchenRepository.createKitchen({ ...rest, passwordHash });
    } catch (error) {
        if (error.code === 11000) throw new AppError('A kitchen with this email already exists', 409);
        throw error;
    }
};

const getAllKitchens = async ({ search, isActive, page, limit }) => {
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
        const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
    }
    const { kitchens, total } = await kitchenRepository.getAllKitchens(filter, (page - 1) * limit, limit);
    return {
        kitchens,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

const getActiveKitchens = () => kitchenRepository.getActiveKitchens();

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

export { createKitchen, getAllKitchens, getActiveKitchens, getPaidOrders, startPreparing, markReady };