import mongoose from 'mongoose';

/**
 * Give-Meal Token Schema
 * Tracks each donated meal from generation to beneficiary drop-off.
 */
export const tokenSchema = new mongoose.Schema(
  {
    tokenCode: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    donorName: {
      type: String,
      trim: true,
    },
    beneficiaryLocation: {
      type: String,
    },
    status: {
      type: String,
      enum: ['generated', 'assigned_to_rider', 'picked_up', 'delivered'],
      default: 'generated',
    },
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default tokenSchema;
