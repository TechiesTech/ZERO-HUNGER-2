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
                'paymentId',
                'assignedRiderId',
                'isDeleted',
                'deletedAt',
                'items.orderId',
            ],
        },
    ]);

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

const updateOrderStatus = async (orderId, previousStatus, newStatus) => {
    const canMove = {
        $and: [
            { $eq: ['$paymentStatus', 'SUCCESS'] },
            { $eq: ['$customerMealStatus', previousStatus] },
        ],
    };

    return Order.findOneAndUpdate(
        { _id: orderId, isDeleted: false },
        [
            {
                $set: {
                    customerMealStatus: { $cond: [canMove, newStatus, '$customerMealStatus'] },
                    updatedAt: { $cond: [canMove, '$$NOW', '$updatedAt'] },
                },
            },
        ],
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
        { _id: orderId, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
    )
        .select('orderNumber')
        .lean();

const updateDeliveryDetails = async ({ orderNumber, customerEmail, ...changes }) =>
    Order.findOneAndUpdate(
        {
            orderNumber,
            customerEmail,
            isDeleted: false,
            customerMealStatus: { $in: ['CONFIRMED', 'PREPARING_IN_KITCHEN'] },
        },
        { $set: changes },
        { new: true, runValidators: true }
    )
        .select('orderNumber customerMealStatus deliveryAddress deliveryLocation')
        .lean();

export {
    findActiveMealsByIds,
    createOrderWithItems,
    trackOrder,
    trackMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
    deleteOrder,
    updateDeliveryDetails,
};