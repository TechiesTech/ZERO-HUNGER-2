import mongoose from 'mongoose';
import { Meal } from '../models/schemas/mealSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { OrderItem } from '../models/schemas/orderItemSchema.js';

const toId = (id) => new mongoose.Types.ObjectId(String(id));

// Adds customer name and phone from users
const customerStages = [
    {
        $lookup: {
            from: 'users',
            localField: 'customerId',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 0, name: 1, phone: 1 } }],
            as: 'customer',
        },
    },
    { $set: { customer: { $arrayElemAt: ['$customer', 0] } } },
];

// Adds deliveryAddress from the customer's saved addresses (deleted ones stay, so old orders still find theirs)
const addressStages = [
    {
        $lookup: {
            from: 'addresses',
            localField: 'customerId',
            foreignField: 'userId',
            let: { orderAddressId: '$addressId' },
            pipeline: [
                {
                    $project: {
                        _id: 0,
                        address: {
                            $arrayElemAt: [
                                {
                                    $filter: {
                                        input: '$addresses',
                                        as: 'saved',
                                        cond: { $eq: ['$$saved._id', '$$orderAddressId'] },
                                    },
                                },
                                0,
                            ],
                        },
                    },
                },
            ],
            as: 'savedAddress',
        },
    },
    { $set: { deliveryAddress: { $arrayElemAt: ['$savedAddress.address', 0] } } },
    { $unset: ['savedAddress', 'deliveryAddress.isDefault', 'deliveryAddress.isDeleted'] },
];

const itemStage = { $lookup: { from: 'orderItems', localField: '_id', foreignField: 'orderId', as: 'items' } };

// Meals that are available (one find, one database call)
const getActiveMeals = async (mealIds) => {
    return Meal.find({ _id: { $in: mealIds }, isDeleted: false, isAvailable: true })
        .select('mealName priceInRupees kitchenId')
        .lean();
};

// Saves the order, then its items (two writes, no transaction)
const createOrder = async (orderData, orderItems) => {
    const order = await Order.create(orderData);

    try {
        const items = await OrderItem.insertMany(orderItems.map((item) => ({ ...item, orderId: order._id })));
        return { order: order.toObject(), items: items.map((item) => item.toObject()) };
    } catch (error) {
        // Items failed, so remove the order to avoid an order with no items
        await Order.deleteOne({ _id: order._id });
        throw error;
    }
};

// Orders of one customer with items and delivery address, newest first
const getMyOrders = async (customerId, skip, limit) => {
    const [result] = await Order.aggregate([
        { $match: { customerId: toId(customerId), isDeleted: false } },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                orders: [
                    { $skip: skip },
                    { $limit: limit },
                    itemStage,
                    ...addressStages,
                    {
                        $unset: [
                            'customerId',
                            'paymentId',
                            'assignedRiderId',
                            'kitchenId',
                            'isDeleted',
                            'deletedAt',
                            'items.orderId',
                        ],
                    },
                ],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    return { orders: result.orders, total: result.total[0]?.count || 0 };
};

const trackLiveOrder = async (orderNumber, customerId) => {
    const [order] = await Order.aggregate([
        {
            $match: {
                orderNumber: String(orderNumber).trim().toUpperCase(),
                customerId: toId(customerId),
                isDeleted: false,
            },
        },
        ...customerStages,
        ...addressStages,
        itemStage,
        {
            $lookup: {
                from: 'kitchens',
                localField: 'kitchenId',
                foreignField: '_id',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            pipeline: [{ $project: { _id: 0, name: 1 } }],
                            as: 'account',
                        },
                    },
                    { $project: { _id: 0, name: { $arrayElemAt: ['$account.name', 0] }, address: 1, location: 1 } },
                ],
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
                            pipeline: [{ $project: { _id: 0, name: 1, vehicleType: 1, currentLocation: 1 } }],
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
                customerName: '$customer.name',
                customerMealStatus: 1,
                paymentStatus: 1,
                totalAmountInr: 1,
                sponsoredMealsCount: 1,
                createdAt: 1,
                estimatedDeliveryAt: 1,
                statusTimestamps: 1,
                deliveryLocation: '$deliveryAddress.location',
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

const cancelOrder = async (orderNumber, customerId) => {
    return Order.findOneAndUpdate(
        {
            orderNumber,
            customerId,
            isDeleted: false,
            customerMealStatus: 'confirmed',
            paymentStatus: { $ne: 'success' },
        },
        { $set: { customerMealStatus: 'cancelled', 'statusTimestamps.cancelledAt': new Date() } },
        { new: true }
    )
        .select('orderNumber customerMealStatus')
        .lean();
};

const updateDeliveryDetails = async (orderNumber, customerId, addressId) => {
    return Order.findOneAndUpdate(
        {
            orderNumber,
            customerId,
            isDeleted: false,
            customerMealStatus: { $in: ['confirmed', 'preparing'] },
        },
        { $set: { addressId } },
        { new: true }
    )
        .select('orderNumber customerMealStatus addressId')
        .lean();
};

// Admin list with customer name, phone and delivery address
const getAllOrders = async (filter, skip, limit) => {
    const [result] = await Order.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                orders: [{ $skip: skip }, { $limit: limit }, ...customerStages, ...addressStages],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    return { orders: result.orders, total: result.total[0]?.count || 0 };
};

const getOrderById = async (orderId) => {
    const [order] = await Order.aggregate([
        { $match: { _id: toId(orderId), isDeleted: false } },
        itemStage,
        ...customerStages,
        ...addressStages,
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

export {
    getActiveMeals,
    createOrder,
    getMyOrders,
    trackLiveOrder,
    cancelOrder,
    updateDeliveryDetails,
    getAllOrders,
    getOrderById,
    getOrderStats,
};