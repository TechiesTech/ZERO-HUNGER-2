import mongoose from 'mongoose';
import { Meal } from '../models/schemas/mealSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { OrderItem } from '../models/schemas/orderItemSchema.js';

const findActiveMealsByIds = async (mealIds) =>
    Meal.find({
        _id: { $in: mealIds },
        isDeleted: false,
        isAvailable: true,
    }).lean();

const createOrderWithItems = async (orderData, orderItems) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [order] = await Order.create([orderData], { session });

        const itemDocs = orderItems.map((item) => ({ ...item, orderId: order._id }));
        const items = await OrderItem.insertMany(itemDocs, { session });

        await session.commitTransaction();
        return { order: order.toObject(), items };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
const trackOrder = async (orderNumber, customerEmail) => {
    const order = await Order.findOne({ orderNumber, customerEmail, isDeleted: false })
        .select('-customerPhone -deliveryAddress -paymentId -assignedRiderId -isDeleted -deletedAt')
        .lean();

    if (!order) return null;

    const items = await OrderItem.find({ orderId: order._id })
        .select('-orderId')
        .lean();

    return { ...order, items };
};
const trackMyOrders = async (pairs) => {
    const orders = await Order.find({ $or: pairs, isDeleted: false })
        .select('-customerPhone -deliveryAddress -paymentId -assignedRiderId -isDeleted -deletedAt')
        .sort({ createdAt: -1 })
        .lean();

    if (orders.length === 0) return [];

    const items = await OrderItem.find({ orderId: { $in: orders.map((order) => order._id) } }).lean();

    const itemsByOrder = new Map();
    items.forEach(({ orderId, ...item }) => {
        const key = String(orderId);
        itemsByOrder.set(key, [...(itemsByOrder.get(key) || []), item]);
    });

    return orders.map((order) => ({ ...order, items: itemsByOrder.get(String(order._id)) || [] }));
};
export { findActiveMealsByIds, createOrderWithItems, trackOrder, trackMyOrders };

