import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderNumber: { type: String, trim: true, uppercase: true },
    customerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, trim: true, default: '' },
    deliveryAddress: { type: String, required: true, trim: true, maxlength: 300 },
    paymentMethod: { type: String, required: true, enum: ['UPI', 'CARD', 'NET_BANKING'] },
    paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payments', default: null },
    totalAmountInr: { type: Number, required: true, min: 1, validate: Number.isInteger },
    sponsoredMealsCount: { type: Number, min: 0, default: 0, validate: Number.isInteger },
    customerMealStatus: {
      type: String,
      enum: ['CONFIRMED', 'PREPARING_IN_KITCHEN', 'OUT_FOR_DELIVERY', 'DELIVERED_TO_CUSTOMER'],
      default: 'CONFIRMED',
    },
    assignedRiderId: { type: Schema.Types.ObjectId, ref: 'Riders', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });
orderSchema.index({ isDeleted: 1, createdAt: -1 });
orderSchema.index({ isDeleted: 1, customerMealStatus: 1, createdAt: -1 });
orderSchema.index({ isDeleted: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ assignedRiderId: 1 });

export const Order = mongoose.model('Orders', orderSchema, 'orders');