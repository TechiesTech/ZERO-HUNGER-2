import AppError from '../utils/appError.js';
import * as kitchenRepository from '../repositories/kitchenRepository.js';

const saveMyKitchen = (kitchenId, { address, location }) =>
    kitchenRepository.saveMyKitchen(kitchenId, { address, location });

const getMyKitchen = async (kitchenId) => {
    const kitchen = await kitchenRepository.findKitchenById(kitchenId);
    return kitchen ? { ...kitchen, detailsComplete: true } : { detailsComplete: false };
};

const getAllKitchens = async ({ search, isActive, page, limit }) => {
    const filter = { isActive };
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

export { saveMyKitchen, getMyKitchen, getAllKitchens, getActiveKitchens, getPaidOrders, startPreparing, markReady };