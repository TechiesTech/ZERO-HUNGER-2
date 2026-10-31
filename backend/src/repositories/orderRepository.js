import mongoose from 'mongoose';
import { Meal } from '../models/schemas/mealSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { OrderItem } from '../models/schemas/orderItemSchema.js';

const findActiveMealsByIds = async (mealIds) =>
    Meal.find({ _id: { $in: mealIds }, isDeleted: false, isAvailable: true })
        .select('mealName priceInRupees')
        .lean();

const createOrderWithItems = async (orderData, orderItems) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [order] = await Order.create([orderData], { session });

        const items = await OrderItem.insertMany(
            orderItems.map((item) => ({ ...item, orderId: order._id })),
            { session }
        );

        await session.commitTransaction();
        return { order: order.toObject(), items: items.map((item) => item.toObject()) };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

const trackOrder = async (orderNumber, customerEmail) => {
    const [order] = await Order.aggregate([
        { $match: { orderNumber, customerEmail, isDeleted: false } },
        { $lookup: { from: 'orderItems', localField: '_id', foreignField: 'orderId', as: 'items' } },
        {
            $unset: [
                'customerPhone',
                'deliveryAddress',
                'deliveryLocation',
                'paymentId',
                'assignedRiderId',
                'isDeleted',
                'deletedAt',
                'items.orderId',
            ],
        },
    ]);

    return order || null;
};

const trackMyOrders = async (pairs) =>
    Order.aggregate([
        { $match: { $or: pairs, isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $lookup: { from: 'orderItems', localField: '_id', foreignField: 'orderId', as: 'items' } },
        {
            $unset: [
                'customerPhone',
                'deliveryAddress',
                'deliveryLocation',
                'paymentId',
                'assignedRiderId',
                'isDeleted',
                'deletedAt',
                'items.orderId',
            ],
        },
    ]);

const trackLiveOrder = async (orderNumber, customerEmail) => {
    const [order] = await Order.aggregate([
        { $match: { orderNumber, customerEmail, isDeleted: false } },
        { $lookup: { from: 'orderItems', localField: '_id', foreignField: 'orderId', as: 'items' } },
        {
            $project: {
                _id: 0,
                orderNumber: 1,
                customerName: 1,
                customerMealStatus: 1,
                paymentStatus: 1,
                totalAmountInr: 1,
                sponsoredMealsCount: 1,
                createdAt: 1,
                estimatedDeliveryAt: 1,
                statusTimestamps: 1,
                deliveryLocation: 1,
                items: {
                    $map: {
                        input: '$items',
                        as: 'item',
                        in: {
                            productName: '$$item.productName',
                            quantity: '$$item.quantity',
                            unitPriceInr: '$$item.unitPriceInr',
                            totalPriceInr: '$$item.totalPriceInr',
                            sponsoredChildMeals: '$$item.sponsoredChildMeals',
                        },
                    },
                },
            },
        },
    ]);

    return order || null;
};
const cancelOrder = async (orderNumber, customerEmail) =>
    Order.findOneAndUpdate(
        {
            orderNumber,
            customerEmail,
            isDeleted: false,
            customerMealStatus: 'confirmed',
            paymentStatus: { $ne: 'success' },
        },
        { $set: { customerMealStatus: 'cancelled', 'statusTimestamps.cancelledAt': new Date() } },
        { new: true }
    )
        .select('orderNumber customerMealStatus')
        .lean();

const getAllOrders = async (filter, skip, limit) => {
    const [result] = await Order.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                orders: [{ $skip: skip }, { $limit: limit }],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    return { orders: result.orders, total: result.total[0]?.count || 0 };
};

const getOrderById = async (orderId) => {
    const [order] = await Order.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(orderId), isDeleted: false } },
        { $lookup: { from: 'orderItems', localField: '_id', foreignField: 'orderId', as: 'items' } },
    ]);

    return order || null;
};

// TODO: require paymentStatus success before moving to preparing (when payments are built)
const updateOrderStatus = async (orderId, previousStatus, newStatus, assignedRiderId) => {
    const canMove = { $eq: ['$customerMealStatus', previousStatus] };
    const timeField = {
        preparing: 'statusTimestamps.preparingAt',
        outfordelivery: 'statusTimestamps.outForDeliveryAt',
        delivered: 'statusTimestamps.deliveredAt',
    }[newStatus];

    const changes = {
        customerMealStatus: { $cond: [canMove, newStatus, '$customerMealStatus'] },
        updatedAt: { $cond: [canMove, '$$NOW', '$updatedAt'] },
        [timeField]: { $cond: [canMove, '$$NOW', `$${timeField}`] },
    };

    if (newStatus === 'outfordelivery') {
        changes.estimatedDeliveryAt = {
            $cond: [canMove, { $add: ['$$NOW', 30 * 60 * 1000] }, '$estimatedDeliveryAt'],
        };
    }

    if (assignedRiderId) {
        changes.assignedRiderId = {
            $cond: [canMove, new mongoose.Types.ObjectId(assignedRiderId), '$assignedRiderId'],
        };
    }

    return Order.findOneAndUpdate(
        { _id: orderId, isDeleted: false },
        [{ $set: changes }],
        { returnDocument: 'before', timestamps: false }
    ).lean();
};

const getOrderStats = async (startOfToday) => {
    const [stats] = await Order.aggregate([
        { $match: { isDeleted: false } },
        {
            $facet: {
                total: [{ $count: 'count' }],
                today: [{ $match: { createdAt: { $gte: startOfToday } } }, { $count: 'count' }],
                byMealStatus: [{ $group: { _id: '$customerMealStatus', count: { $sum: 1 } } }],
                byPaymentStatus: [{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }],
            },
        },
    ]);

    return stats;
};

const deleteOrder = async (orderId) =>
    Order.findOneAndUpdate(
        {
            _id: orderId,
            isDeleted: false,
            customerMealStatus: { $in: ['confirmed', 'cancelled'] },
            paymentStatus: { $ne: 'success' },
        },
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
    )
        .select('orderNumber')
        .lean();

const updateDeliveryDetails = async ({ orderNumber, customerEmail, ...changes }) => {
    if (changes.deliveryAddress && !changes.deliveryLocation) {
        changes.deliveryLocation = { latitude: null, longitude: null };
    }
    return Order.findOneAndUpdate(
        {
            orderNumber,
            customerEmail,
            isDeleted: false,
            customerMealStatus: { $in: ['confirmed', 'preparing'] },
        },
        { $set: changes },
        { new: true, runValidators: true }
    )
        .select('orderNumber customerMealStatus deliveryAddress deliveryLocation')
        .lean();
};

export {
    findActiveMealsByIds,
    createOrderWithItems,
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