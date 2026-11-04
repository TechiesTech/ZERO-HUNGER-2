import { Kitchen } from '../models/schemas/kitchenSchema.js';
import { Order } from '../models/schemas/orderSchema.js';

const createKitchen = async (data) => {
    const kitchen = await Kitchen.create(data);
    const { passwordHash, ...safe } = kitchen.toObject();
    return safe;
};

const getAllKitchens = async (filter, skip, limit) => {
    const [kitchens, total] = await Promise.all([
        Kitchen.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Kitchen.countDocuments(filter),
    ]);
    return { kitchens, total };
};

const findOrdersForKitchen = (kitchenId) =>
    Order.aggregate([
        {
            $match: {
                kitchenId,
                isDeleted: false,
                paymentStatus: 'success',
                customerMealStatus: { $in: ['confirmed', 'preparing', 'readyforpickup'] },
            },
        },
        { $sort: { createdAt: 1 } },
        { $lookup: { from: 'orderItems', localField: '_id', foreignField: 'orderId', as: 'items' } },
        { $unset: ['items.orderId'] },
    ]);

const moveOrderStatus = (orderId, kitchenId, from, to, stampField) =>
    Order.findOneAndUpdate(
        { _id: orderId, kitchenId, isDeleted: false, paymentStatus: 'success', customerMealStatus: from },
        { $set: { customerMealStatus: to, [`statusTimestamps.${stampField}`]: new Date() } },
        { new: true, runValidators: true }
    ).lean();

export { createKitchen, getAllKitchens, findOrdersForKitchen, moveOrderStatus };