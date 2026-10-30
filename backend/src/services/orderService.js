import crypto from 'crypto';
import AppError from '../utils/appError.js';
import * as orderRepository from '../repositories/orderRepository.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_ORDER_NUMBER_ATTEMPTS = 3;

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

    for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
        const code = Array.from(
            { length: 6 },
            () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]
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
export {
    createOrder,
    trackOrder,
    trackMyOrders,
    getAllOrders,
    getOrderById
};
