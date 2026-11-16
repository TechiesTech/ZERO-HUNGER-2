import AppError from '../utils/appError.js';
import * as kitchenRepository from '../repositories/kitchenRepository.js';

const saveMyKitchen = (kitchenId, data) => kitchenRepository.saveMyKitchen(kitchenId, data);

const getMyKitchen = async (kitchenId) => {
    const kitchen = await kitchenRepository.getMyKitchen(kitchenId);
    return kitchen ? { ...kitchen, detailsComplete: true } : { detailsComplete: false };
};

const getAllKitchens = async ({ search, isActive, page, limit }) => {
    const { kitchens, total } = await kitchenRepository.getAllKitchens({ search, isActive, page, limit });
    return {
        kitchens,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

const getActiveKitchens = () => kitchenRepository.getActiveKitchens();

const getPaidOrders = (kitchenId) => kitchenRepository.getPaidOrders(kitchenId);

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

export { saveMyKitchen, getMyKitchen, getAllKitchens, getActiveKitchens, getPaidOrders, startPreparing, markReady };