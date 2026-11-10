import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    totalAmountInr: { type: Number, required: true, min: 0 },
    sponsoredMealsCount: { type: Number, default: 0, min: 0 },
    customerMealStatus: {
      type: String,
      enum: ['confirmed', 'preparing', 'readyforpickup', 'outfordelivery', 'delivered', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    statusTimestamps: {
      preparingAt: { type: Date, default: null },
      readyAt: { type: Date, default: null },
      outForDeliveryAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
    },
    estimatedDeliveryAt: { type: Date, default: null },

    kitchenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedRiderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', default: null },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);