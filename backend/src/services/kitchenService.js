import AppError from '../utils/appError.js';
import * as kitchenRepository from '../repositories/kitchenRepository.js';
import { notifyOrderStatus, notifyOrderReady } from '../socket.js';

const saveMyKitchen = (kitchenId, data) => kitchenRepository.saveMyKitchen(kitchenId, data);

const getMyKitchen = async (kitchenId) => {
    const kitchen = await kitchenRepository.getMyKitchen(kitchenId);
    return kitchen ? { ...kitchen, detailsComplete: true } : { detailsComplete: false };
};

const setServiceRadius = async (kitchenId, { serviceRadiusKm }) => {
    const kitchen = await kitchenRepository.setServiceRadius(kitchenId, serviceRadiusKm);
    if (!kitchen) throw new AppError('Kitchen not found, or it has not saved its details yet', 404);
    return kitchen;
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

    notifyOrderStatus({
        orderNumber: order.orderNumber,
        status: order.customerMealStatus,
        customerId: order.customerId,
        kitchenId: order.kitchenId,
    });
    return order;
};

const markReady = async (orderId, kitchenId) => {
    const order = await kitchenRepository.moveOrderStatus(orderId, kitchenId, 'preparing', 'readyforpickup', 'readyAt');
    if (!order) throw new AppError('Order not found or not being prepared', 404);

    notifyOrderStatus({
        orderNumber: order.orderNumber,
        status: order.customerMealStatus,
        customerId: order.customerId,
        kitchenId: order.kitchenId,
    });
    notifyOrderReady(order.orderNumber); // riders see it at once
    return order;
};

export { saveMyKitchen, setServiceRadius, getMyKitchen, getAllKitchens, getActiveKitchens, getPaidOrders, startPreparing, markReady };