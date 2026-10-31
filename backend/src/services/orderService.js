import crypto from 'crypto';
import AppError from '../utils/appError.js';
import * as orderRepository from '../repositories/orderRepository.js';

const createOrder = async (body) => {
    const quantityByMeal = new Map();
    body.items.forEach(({ mealId, quantity }) => {
        quantityByMeal.set(mealId, (quantityByMeal.get(mealId) || 0) + quantity);
    });
    const meals = await orderRepository.findActiveMealsByIds([...quantityByMeal.keys()]);
    const mealById = new Map(meals.map((meal) => [String(meal._id), meal]));

    const orderItems = [...quantityByMeal].map(([mealId, quantity]) => {
        const meal = mealById.get(mealId);
        if (!meal) throw new AppError('One or more meals are not available', 400);
        return {
            mealId: meal._id,
            productName: meal.mealName,
            quantity,
            unitPriceInr: meal.priceInRupees,
            totalPriceInr: meal.priceInRupees * quantity,
            isEligibleBuyOneGiveOne: true,
            sponsoredChildMeals: quantity,
        };
    });
    const orderData = {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        deliveryAddress: body.deliveryAddress,
        deliveryLocation: body.deliveryLocation,
        paymentMethod: body.paymentMethod,
        totalAmountInr: orderItems.reduce((sum, item) => sum + item.totalPriceInr, 0),
        sponsoredMealsCount: orderItems.reduce((sum, item) => sum + item.sponsoredChildMeals, 0),
    };

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const code = Array.from(
            { length: 6 },
            () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[crypto.randomInt(32)]
        ).join('');
        try {
            const { order, items } = await orderRepository.createOrderWithItems(
                { ...orderData, orderNumber: `ZH-ORD-${code}` },
                orderItems
            );

            return { ...order, items };
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
    }
    throw new AppError('Could not create the order, please try again', 409);
};

const trackOrder = async ({ orderNumber, customerEmail }) => {
    const order = await orderRepository.trackOrder(orderNumber, customerEmail);
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    return order;
};

const trackMyOrders = async ({ orders }) => orderRepository.trackMyOrders(orders);

const trackLiveOrder = async ({ orderNumber, customerEmail }) => {
    const order = await orderRepository.trackLiveOrder(orderNumber, customerEmail);

    if (!order) {
        throw new AppError('Order not found', 404);
    }
    const times = order.statusTimestamps || {};
    const status = order.customerMealStatus;
    const isFinished = status === 'delivered' || status === 'cancelled';
    const { latitude, longitude } = order.deliveryLocation || {};
    const timeline =
        status === 'cancelled'
            ? [
                { status: 'confirmed', at: order.createdAt },
                { status: 'cancelled', at: times.cancelledAt || null },
            ]
            : [
                { status: 'confirmed', at: order.createdAt },
                { status: 'preparing', at: times.preparingAt || null },
                { status: 'outfordelivery', at: times.outForDeliveryAt || null },
                { status: 'delivered', at: times.deliveredAt || null },
            ];

    return {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerMealStatus: status,
        paymentStatus: order.paymentStatus,
        totalAmountInr: order.totalAmountInr,
        sponsoredMealsCount: order.sponsoredMealsCount,
        placedAt: order.createdAt,
        estimatedDeliveryAt: status === 'outfordelivery' ? order.estimatedDeliveryAt || null : null,
        timeline,
        destination:
            !isFinished && latitude != null && longitude != null ? { latitude, longitude } : null,
        rider: null,
        items: order.items,
        canEditDetails: status === 'confirmed' || status === 'preparing',
        canCancel: status === 'confirmed' && order.paymentStatus !== 'success',
    };
};

const cancelOrder = async ({ orderNumber, customerEmail }) => {
    const order = await orderRepository.cancelOrder(orderNumber, customerEmail);
    if (!order) {
        throw new AppError('Order not found or can no longer be cancelled', 404);
    }
    return order;
};
const getAllOrders = async ({ customerMealStatus, paymentStatus, search, from, to, page, limit }) => {
    const filter = { isDeleted: false };
    if (customerMealStatus) filter.customerMealStatus = customerMealStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = from;
        if (to) filter.createdAt.$lte = to;
    }
    if (search) {
        const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ orderNumber: pattern }, { customerName: pattern }, { customerEmail: pattern }];
    }
    const { orders, total } = await orderRepository.getAllOrders(filter, (page - 1) * limit, limit);
    return {
        orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

const getOrderById = async (orderId) => {
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    return order;
};

const updateOrderStatus = async (orderId, { customerMealStatus, assignedRiderId }) => {
    const statusFlow = ['confirmed', 'preparing', 'outfordelivery', 'delivered'];
    const previousStatus = statusFlow[statusFlow.indexOf(customerMealStatus) - 1];
    if (!previousStatus) {
        throw new AppError('Order cannot be moved back to confirmed', 409);
    }
    const order = await orderRepository.updateOrderStatus(
        orderId,
        previousStatus,
        customerMealStatus,
        assignedRiderId
    );
    if (!order) throw new AppError('Order not found', 404);
    const current = order.customerMealStatus;
    if (current === customerMealStatus) {
        throw new AppError(`Order is already ${current}`, 409);
    }
    if (current === 'cancelled') {
        throw new AppError('Cancelled orders cannot be changed', 409);
    }
    if (current !== previousStatus) {
        const nextStatus = statusFlow[statusFlow.indexOf(current) + 1];
        throw new AppError(
            nextStatus
                ? `Status can only move from ${current} to ${nextStatus}`
                : 'Order is already delivered',
            409
        );
    }
    return {
        ...order,
        customerMealStatus,
        ...(assignedRiderId && { assignedRiderId }),
        updatedAt: new Date(),
    };
};

const getOrderStats = async () => {
    const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    istNow.setUTCHours(0, 0, 0, 0);
    const startOfToday = new Date(istNow.getTime() - 5.5 * 60 * 60 * 1000);
    const stats = await orderRepository.getOrderStats(startOfToday);
    return {
        totalOrders: stats.total[0]?.count || 0,
        ordersToday: stats.today[0]?.count || 0,
        byMealStatus: Object.fromEntries(stats.byMealStatus.map(({ _id, count }) => [_id, count])),
        byPaymentStatus: Object.fromEntries(stats.byPaymentStatus.map(({ _id, count }) => [_id, count])),
    };
};

const deleteOrder = async (orderId) => {
    const order = await orderRepository.deleteOrder(orderId);
    if (!order) {
        throw new AppError('Order not found or cannot be deleted', 404);
    }
    return order;
};

const updateDeliveryDetails = async (payload) => {
    const order = await orderRepository.updateDeliveryDetails(payload);
    if (!order) {
        throw new AppError('Order not found or can no longer be changed', 404);
    }
    return order;
};
export {
    createOrder,
    trackOrder,
    trackMyOrders,
    trackLiveOrder,
    cancelOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
    deleteOrder,
    updateDeliveryDetails,
};