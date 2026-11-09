import { Kitchen } from '../models/schemas/kitchenSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { OrderItem } from '../models/schemas/orderItemSchema.js';

const createKitchen = async (data) => {
    const kitchen = await Kitchen.create(data);
    return kitchen.toObject();
};

const getAllKitchens = async (filter, skip, limit) => {
    const { isActive, ...profileFilter } = filter;
    const [result] = await Kitchen.aggregate([
        { $match: profileFilter },
        {
            $lookup: {
                from: 'users',
                let: { kitchenId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$kitchenId'] },
                                    { $in: ['kitchen', { $ifNull: ['$roles', []] }] },
                                ],
                            },
                        },
                    },
                    { $project: { status: 1, mustChangePassword: 1 } },
                ],
                as: 'account',
            },
        },
        { $unwind: '$account' },
        { $addFields: { isActive: { $eq: ['$account.status', 'active'] }, mustChangePassword: '$account.mustChangePassword' } },
        ...(isActive === undefined ? [] : [{ $match: { isActive } }]),
        {
            $facet: {
                kitchens: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    { $project: { account: 0, passwordHash: 0, tokenVersion: 0, lockedUntil: 0, failedLoginAttempts: 0 } },
                ],
                metadata: [{ $count: 'total' }],
            },
        },
    ]);
    return { kitchens: result?.kitchens || [], total: result?.metadata[0]?.total || 0 };
};

const getActiveKitchens = () =>
    Kitchen.aggregate([
        {
            $lookup: {
                from: 'users',
                let: { kitchenId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$kitchenId'] },
                                    { $in: ['kitchen', { $ifNull: ['$roles', []] }] },
                                    { $eq: ['$status', 'active'] },
                                ],
                            },
                        },
                    },
                    { $project: { _id: 1 } },
                ],
                as: 'account',
            },
        },
        { $match: { account: { $ne: [] } } },
        { $project: { name: 1, address: 1, location: 1 } },
        { $sort: { name: 1 } },
    ]);

const findOrdersForKitchen = async (kitchenId) => {
    const orders = await Order.find({
        kitchenId,
        isDeleted: false,
        paymentStatus: 'success',
        customerMealStatus: { $in: ['confirmed', 'preparing', 'readyforpickup'] },
    })
        .sort({ createdAt: 1 })
        .lean();

    if (orders.length === 0) return [];

    const items = await OrderItem.find({ orderId: { $in: orders.map(({ _id }) => _id) } }).lean();
    const itemsByOrderId = new Map();
    for (const item of items) {
        const key = String(item.orderId);
        const orderItems = itemsByOrderId.get(key) || [];
        orderItems.push(item);
        itemsByOrderId.set(key, orderItems);
    }

    return orders.map((order) => ({
        ...order,
        items: itemsByOrderId.get(String(order._id)) || [],
    }));
};

const moveOrderStatus = (orderId, kitchenId, from, to, stampField) =>
    Order.findOneAndUpdate(
        { _id: orderId, kitchenId, isDeleted: false, paymentStatus: 'success', customerMealStatus: from },
        { $set: { customerMealStatus: to, [`statusTimestamps.${stampField}`]: new Date() } },
        { new: true, runValidators: true }
    ).lean();

export { createKitchen, getAllKitchens, getActiveKitchens, findOrdersForKitchen, moveOrderStatus };