import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, trim: true, uppercase: true },
    customerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, trim: true, default: '' },
    deliveryAddress: {
      addressLine1: { type: String, required: true, trim: true, maxlength: 120 },
      addressLine2: { type: String, trim: true, maxlength: 120, default: '' },
      area: { type: String, required: true, trim: true, maxlength: 80 },
      landmark: { type: String, trim: true, maxlength: 80, default: '' },
      city: { type: String, required: true, trim: true, maxlength: 60 },
      state: { type: String, required: true, trim: true, maxlength: 60 },
      pincode: { type: String, required: true, trim: true, match: /^[1-9][0-9]{5}$/ },
    },
    deliveryLocation: {
      latitude: { type: Number, min: -90, max: 90, default: null },
      longitude: { type: Number, min: -180, max: 180, default: null },
    },
    paymentMethod: { type: String, required: true, enum: ['upi', 'card', 'netbanking'] },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payments', default: null },
    totalAmountInr: { type: Number, required: true, min: 1, validate: Number.isInteger },
    sponsoredMealsCount: { type: Number, min: 0, default: 0, validate: Number.isInteger },
    customerMealStatus: {
      type: String,
      enum: ['confirmed', 'preparing', 'outfordelivery', 'delivered', 'cancelled'],
      default: 'confirmed',
    },
    statusTimestamps: {
      preparingAt: { type: Date, default: null },
      outForDeliveryAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
    },
    estimatedDeliveryAt: { type: Date, default: null },
    assignedRiderId: { type: Schema.Types.ObjectId, ref: 'Riders', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ isDeleted: 1, createdAt: -1 });
orderSchema.index({ isDeleted: 1, customerMealStatus: 1, createdAt: -1 });
orderSchema.index({ isDeleted: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ 'deliveryAddress.pincode': 1 });
orderSchema.index(
  { assignedRiderId: 1 },
  { partialFilterExpression: { assignedRiderId: { $type: 'objectId' } } }
);

export const Order = mongoose.model('Orders', orderSchema, 'orders');