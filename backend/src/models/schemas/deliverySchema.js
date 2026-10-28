import mongoose from 'mongoose';

/**
 * Delivery Schema
 * Tracks meal drop-off assignments to volunteer riders.
 */
export const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'delivered'],
      default: 'pending',
    },
    proofPhotoUrl: {
      type: String,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default deliverySchema;
