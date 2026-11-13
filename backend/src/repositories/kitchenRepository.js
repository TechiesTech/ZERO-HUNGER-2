import { Kitchen } from '../models/schemas/kitchenSchema.js';
import { User } from '../models/schemas/userSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { OrderItem } from '../models/schemas/orderItemSchema.js';

const findKitchenById = (id) => Kitchen.findById(id).select('address location').lean();

// Add or update the kitchen's own details (address + lat/long)
const saveMyKitchen = (kitchenId, data) =>
    Kitchen.findOneAndUpdate(
        { _id: kitchenId },
        { $set: { ...data, user: kitchenId } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

// Starts from users, so a kitchen account without details yet is also listed
const getAllKitchens = async ({ isActive, $or }, skip, limit) => {
    const match = { roles: 'kitchen' };
    if (isActive !== undefined) match.status = isActive ? 'active' : { $ne: 'active' };
    if ($or) match.$or = $or;

    const [result] = await User.aggregate([
        { $match: match },
        {
            $lookup: {
                from: 'kitchens',
                localField: '_id',
                foreignField: '_id',
                pipeline: [{ $project: { address: 1, location: 1 } }],
                as: 'details',
            },
        },
        { $addFields: { details: { $arrayElemAt: ['$details', 0] } } },
        {
            $project: {
                name: 1,
                email: 1,
                phone: 1,
                status: 1,
                mustChangePassword: 1,
                createdAt: 1,
                isActive: { $eq: ['$status', 'active'] },
                address: '$details.address',
                location: '$details.location',
                detailsComplete: { $ne: [{ $type: '$details' }, 'missing'] },
            },
        },
        {
            $facet: {
                kitchens: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
                metadata: [{ $count: 'total' }],
            },
        },
    ]);
    return { kitchens: result?.kitchens || [], total: result?.metadata[0]?.total || 0 };
};

// Public menu picker: expose every kitchen profile without account details.
const getActiveKitchens = () =>
    Kitchen.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                pipeline: [{ $project: { name: 1 } }],
                as: 'account',
            },
        },
        {
            $addFields: {
                name: { $ifNull: [{ $arrayElemAt: ['$account.name', 0] }, '$address'] },
            },
        },
        {
            $project: {
                name: 1,
                address: 1,
                location: 1,
            },
        },
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

export { findKitchenById, saveMyKitchen, getAllKitchens, getActiveKitchens, findOrdersForKitchen, moveOrderStatus };