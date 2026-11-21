import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        vehicleType: { type: String, required: true, enum: ['bike', 'scooty'] },
        vehicleNumber: { type: String, trim: true, uppercase: true, default: '' },

        isAvailable: { type: Boolean, default: false },
        totalDeliveries: { type: Number, min: 0, default: 0 },

        currentLocation: {
            latitude: { type: Number, min: -90, max: 90, default: null },
            longitude: { type: Number, min: -180, max: 180, default: null },
            heading: { type: Number, min: 0, max: 360, default: null },
            updatedAt: { type: Date, default: null },
        },
    },
    { timestamps: true, versionKey: false }
);

riderSchema.index({ userId: 1 }, { unique: true });
riderSchema.index({ vehicleNumber: 1 }, { unique: true, partialFilterExpression: { vehicleNumber: { $type: 'string', $gt: '' } } });
riderSchema.index({ isAvailable: 1, 'currentLocation.updatedAt': -1 });

export const Rider = mongoose.model('Rider', riderSchema, 'riders');