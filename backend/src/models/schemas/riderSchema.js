import mongoose from 'mongoose';

/**
 * Rider Schema
 * Volunteer and delivery partner profiles.
 */
export const riderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['bicycle', 'scooter', 'bike', 'other'],
      default: 'bike',
    },
    vehicleNumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'offline', 'delivering'],
      default: 'offline',
    },
    currentCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
  },
  {
    timestamps: true,
  }
);

export default riderSchema;
