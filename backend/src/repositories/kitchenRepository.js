import { Order } from '../models/schemas/orderSchema.js';

const findOrdersForKitchen = (kitchenId) =>
    Order.find({
        kitchenId,
        isDeleted: false,
        paymentStatus: 'success',
        customerMealStatus: { $in: ['confirmed', 'preparing', 'readyforpickup'] },
    })
        .sort({ createdAt: 1 })
        .lean();

const moveOrderStatus = (orderId, kitchenId, from, to, stampField) =>
    Order.findOneAndUpdate(
        { _id: orderId, kitchenId, isDeleted: false, paymentStatus: 'success', customerMealStatus: from },
        { $set: { customerMealStatus: to, [`statusTimestamps.${stampField}`]: new Date() } },
        { new: true, runValidators: true }
    ).lean();

export { findOrdersForKitchen, moveOrderStatus };
