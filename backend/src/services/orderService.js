import crypto from 'crypto';
import AppError from '../utils/appError.js';
import * as orderRepository from '../repositories/orderRepository.js';
import * as addressRepository from '../repositories/addressRepository.js';
import * as geocoder from '../utils/geocoder.js';
import { getCachedRoute } from '../utils/roadRoute.js';

const createOrder = async (user, body) => {
    // 1. The address must belong to this customer and not be deleted
    const address = await addressRepository.getAddress(user._id, body.addressId);
    if (!address) throw new AppError('Address not found', 404);

    // 2. Prices always come from the database, never from the request
    const meals = await orderRepository.getActiveMeals(body.items.map((item) => item.mealId));

    const orderItems = body.items.map(({ mealId, quantity }) => {
        const meal = meals.find((m) => String(m._id) === mealId);
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

    // 3. One order can only use one kitchen
    const kitchenId = meals[0].kitchenId;
    if (meals.some((meal) => String(meal.kitchenId) !== String(kitchenId))) {
        throw new AppError('All meals in one order must be from the same kitchen', 400);
    }

    const orderData = {
        customerId: user._id,
        addressId: address._id,
        paymentMethod: body.paymentMethod,
        kitchenId,
        totalAmountInr: orderItems.reduce((sum, item) => sum + item.totalPriceInr, 0),
        sponsoredMealsCount: orderItems.reduce((sum, item) => sum + item.sponsoredChildMeals, 0),
    };

    // 4. Random order number, try again if it already exists
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const orderNumber = `ZH-ORD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        try {
            const { order, items } = await orderRepository.createOrder({ ...orderData, orderNumber }, orderItems);
            return { ...order, items };
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
    }
    throw new AppError('Could not create the order, please try again', 409);
};

const getCheckoutDetails = async (user) => {
    const addresses = await addressRepository.getMyAddresses(user._id);
    return {
        customer: { name: user.name, email: user.email || null, phone: user.phone || '' },
        addresses,
        defaultAddress: addresses.find((address) => address.isDefault) || addresses[0] || null,
    };
};

const getMyOrders = async (user, { page, limit }) => {
    const { orders, total } = await orderRepository.getMyOrders(user._id, (page - 1) * limit, limit);
    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const reverseGeocode = async (point) => geocoder.reverseGeocode(point);

const trackLiveOrder = async (user, orderNumber) => {
    const order = await orderRepository.trackLiveOrder(orderNumber, user._id);
    if (!order) throw new AppError('Order not found', 404);

    const status = order.customerMealStatus;
    const isFinished = status === 'delivered' || status === 'cancelled';
    const times = order.statusTimestamps || {};

    const timeline =
        status === 'cancelled'
            ? [
                { status: 'confirmed', at: order.createdAt },
                { status: 'cancelled', at: times.cancelledAt || null },
            ]
            : [
                { status: 'confirmed', at: order.createdAt },
                { status: 'preparing', at: times.preparingAt || null },
                { status: 'readyforpickup', at: times.readyAt || null },
                { status: 'outfordelivery', at: times.outForDeliveryAt || null },
                { status: 'delivered', at: times.deliveredAt || null },
            ];

    // Map data is only needed while the order is still active
    let destination = null;
    let kitchen = null;
    let rider = null;
    let toKitchen = null;
    let toCustomer = null;
    let estimatedDeliveryAt = null;

    if (!isFinished) {
        destination = order.deliveryLocation?.latitude != null ? order.deliveryLocation : null;

        const kitchenPoint = order.kitchen?.location?.latitude != null ? order.kitchen.location : null;
        if (order.kitchen) {
            kitchen = { name: order.kitchen.name, address: order.kitchen.address, location: kitchenPoint };
        }

        const riderInfo = order.delivery?.rider;
        const riderLocation = riderInfo?.currentLocation || {};
        const updatedAt = riderLocation.updatedAt ? new Date(riderLocation.updatedAt) : null;
        const isLocationStale = !updatedAt || Date.now() - updatedAt.getTime() > 2 * 60 * 1000;

        // An old position is never used for the route, the ETA or the marker
        const riderPoint = riderLocation.latitude != null && !isLocationStale ? riderLocation : null;

        if (riderInfo) {
            rider = {
                name: riderInfo.name,
                vehicleType: riderInfo.vehicleType,
                status: order.delivery.status,
                acceptedAt: order.delivery.acceptedAt || null,
                pickedUpAt: order.delivery.pickedUpAt || null,
                currentLocation: {
                    latitude: riderPoint ? riderLocation.latitude : null,
                    longitude: riderPoint ? riderLocation.longitude : null,
                    heading: riderPoint ? (riderLocation.heading ?? null) : null,
                    updatedAt,
                },
                isLocationStale,
            };
        }

        // Routes (a route is null when the routing server fails, so every use below is guarded)
        if (destination && status === 'outfordelivery' && riderPoint) {
            toCustomer = await getCachedRoute(order.orderNumber, 'rider-to-customer', riderPoint, destination);
        } else if (destination && status !== 'outfordelivery' && kitchenPoint) {
            if (riderPoint) {
                toKitchen = await getCachedRoute(order.orderNumber, 'rider-to-kitchen', riderPoint, kitchenPoint);
            }
            toCustomer = await getCachedRoute(order.orderNumber, 'kitchen-to-customer', kitchenPoint, destination);
        }

        // Estimated delivery time
        if (status === 'outfordelivery' && toCustomer) {
            estimatedDeliveryAt = new Date(Date.now() + toCustomer.durationSeconds * 1000);
        } else if (status === 'readyforpickup' && toKitchen && toCustomer) {
            estimatedDeliveryAt = new Date(Date.now() + (toKitchen.durationSeconds + toCustomer.durationSeconds) * 1000);
        } else if (status === 'outfordelivery') {
            // No live route, use the saved estimate
            estimatedDeliveryAt = order.estimatedDeliveryAt || null;
        }
    }

    return {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerMealStatus: status,
        paymentStatus: order.paymentStatus,
        totalAmountInr: order.totalAmountInr,
        sponsoredMealsCount: order.sponsoredMealsCount,
        placedAt: order.createdAt,
        estimatedDeliveryAt,
        timeline,
        destination,
        kitchen,
        rider,
        routes: { toKitchen, toCustomer },
        items: order.items,
        canEditDetails: status === 'confirmed' || status === 'preparing',
        canCancel: status === 'confirmed' && order.paymentStatus !== 'success',
    };
};

const cancelOrder = async (user, orderNumber) => {
    const order = await orderRepository.cancelOrder(orderNumber, user._id);
    if (!order) throw new AppError('Order not found or can no longer be cancelled', 404);
    return order;
};

// Delivers this order to another saved address of the same customer
const updateDeliveryDetails = async (user, orderNumber, { addressId }) => {
    const address = await addressRepository.getAddress(user._id, addressId);
    if (!address) throw new AppError('Address not found', 404);

    const order = await orderRepository.updateDeliveryDetails(orderNumber, user._id, address._id);
    if (!order) throw new AppError('Order not found or can no longer be changed', 404);
    return order;
};

const getAllOrders = async ({ customerMealStatus, paymentStatus, search, from, to, page, limit }) => {
    const filter = { isDeleted: false };
    if (customerMealStatus) filter.customerMealStatus = customerMealStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from) filter.createdAt = { ...filter.createdAt, $gte: from };
    if (to) filter.createdAt = { ...filter.createdAt, $lte: to };
    if (search) filter.orderNumber = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const { orders, total } = await orderRepository.getAllOrders(filter, (page - 1) * limit, limit);
    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getOrderById = async (orderId) => {
    const order = await orderRepository.getOrderById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    return order;
};

const getOrderStats = async () => {
    // Start of today in Indian time (IST = UTC + 5:30)
    const offset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(Date.now() + offset);
    istNow.setUTCHours(0, 0, 0, 0);
    const startOfToday = new Date(istNow.getTime() - offset);

    const stats = await orderRepository.getOrderStats(startOfToday);
    return {
        totalOrders: stats.total[0]?.count || 0,
        ordersToday: stats.today[0]?.count || 0,
        byMealStatus: Object.fromEntries(stats.byMealStatus.map(({ _id, count }) => [_id, count])),
        byPaymentStatus: Object.fromEntries(stats.byPaymentStatus.map(({ _id, count }) => [_id, count])),
    };
};

export {
    createOrder,
    getCheckoutDetails,
    getMyOrders,
    reverseGeocode,
    trackLiveOrder,
    cancelOrder,
    updateDeliveryDetails,
    getAllOrders,
    getOrderById,
    getOrderStats,
};