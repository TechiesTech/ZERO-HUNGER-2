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

export { findActiveMealsByIds, createOrderWithItems };

