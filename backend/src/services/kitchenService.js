import AppError from '../utils/appError.js';
import * as kitchenRepository from '../repositories/kitchenRepository.js';
import * as authService from './authService.js';

const createKitchen = async ({ name, email, phone, password, ...rest }) => {
    const user = await authService.createStaffAccount({ name, email, phone, password, role: 'kitchen' });
    try {
        return await kitchenRepository.createKitchen({ ...rest, _id: user._id, name, email, phone });
    } catch (error) {
        await authService.deleteUser(user._id);
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