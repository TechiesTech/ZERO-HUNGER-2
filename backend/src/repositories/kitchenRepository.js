import { Kitchen } from '../models/schemas/kitchenSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { OrderItem } from '../models/schemas/orderItemSchema.js';

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

const getActiveKitchens = () =>
    Kitchen.find({ isActive: true }).select('name address location').sort({ name: 1 }).lean();

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