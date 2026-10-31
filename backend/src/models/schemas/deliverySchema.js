import mongoose from 'mongoose';

const { Schema } = mongoose;

export const deliverySchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Orders',
      required: true,
    },
    token: {
      type: String,
      trim: true,
      default: '',
    },
    riderId: {
      type: Schema.Types.ObjectId,
      ref: 'Riders',
      default: null,
    },
    deliveryPartnerId: {
      type: String,
      trim: true,
      default: null,
    },
    pickupAddress: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryAddress: {
      type: Schema.Types.Mixed,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'outfordelivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      timestamp: { type: Date, default: null },
    },
    locationHistory: [
      {
        latitude: { type: Number },
        longitude: { type: Number },
        timestamp: { type: Date },
      },
    ],
    lastLocationUpdate: {
      type: Date,
      default: null,
    },
    proofPhotoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

deliverySchema.index({ orderId: 1 });
deliverySchema.index({ token: 1 }, { sparse: true });
deliverySchema.index({ riderId: 1 });

export const Delivery = mongoose.model('Deliveries', deliverySchema, 'deliveries');
