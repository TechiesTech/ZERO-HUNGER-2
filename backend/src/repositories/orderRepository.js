import mongoose from 'mongoose';
import { Meal } from '../models/schemas/mealSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { OrderItem } from '../models/schemas/orderItemSchema.js';

const findActiveMealsByIds = async (mealIds) =>
    Meal.aggregate([
        {
            $match: {
                _id: { $in: mealIds.map((mealId) => new mongoose.Types.ObjectId(mealId)) },
                isDeleted: false,
                isAvailable: true,
            },
        },
        {
            $lookup: {
                from: 'kitchens',
                localField: 'kitchenId',
                foreignField: '_id',
                pipeline: [{ $match: { isActive: true } }, { $project: { _id: 1 } }],
                as: 'kitchen',
            },
        },
        { $match: { kitchen: { $ne: [] } } },
        { $project: { mealName: 1, priceInRupees: 1, kitchenId: 1 } },
    ]);

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
                'deliveryLocation',
                'paymentId',
                'assignedRiderId',
                'kitchenId',
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
                'kitchenId',
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
            $lookup: {
                from: 'kitchens',
                localField: 'kitchenId',
                foreignField: '_id',
                pipeline: [{ $project: { _id: 0, name: 1, address: 1, location: 1 } }],
                as: 'kitchen',
            },
        },
        {
            $lookup: {
                from: 'deliveries',
                localField: '_id',
                foreignField: 'orderId',
                pipeline: [
                    { $match: { isOpen: true } },
                    {
                        $lookup: {
                            from: 'riders',
                            localField: 'riderId',
                            foreignField: '_id',
                            pipeline: [
                                { $project: { _id: 0, name: 1, vehicleType: 1, currentLocation: 1 } },
                            ],
                            as: 'rider',
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            status: 1,
                            acceptedAt: 1,
                            pickedUpAt: 1,
                            rider: { $arrayElemAt: ['$rider', 0] },
                        },
                    },
                ],
                as: 'deliveries',
            },
        },
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
                kitchen: { $arrayElemAt: ['$kitchen', 0] },
                delivery: { $arrayElemAt: ['$deliveries', 0] },
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
        {
            $lookup: {
                from: 'deliveries',
                localField: '_id',
                foreignField: 'orderId',
                pipeline: [
                    { $sort: { createdAt: 1 } },
                    {
                        $lookup: {
                            from: 'riders',
                            localField: 'riderId',
                            foreignField: '_id',
                            pipeline: [{ $project: { name: 1, phone: 1 } }],
                            as: 'rider',
                        },
                    },
                    { $set: { rider: { $arrayElemAt: ['$rider', 0] } } },
                    { $project: { photoPublicId: 0 } },
                ],
                as: 'deliveries',
            },
        },
    ]);

    return order || null;
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
    getOrderStats,
    deleteOrder,
    updateDeliveryDetails,
};
