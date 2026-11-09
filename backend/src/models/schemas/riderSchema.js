import mongoose from 'mongoose';

const { Schema } = mongoose;

const riderSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        phone: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true, default: '' },
        passwordHash: { type: String, select: false },
        tokenVersion: { type: Number, default: 0 },
        vehicleType: { type: String, required: true, enum: ['bike', 'bicycle', 'scooter'] },
        vehicleNumber: { type: String, trim: true, uppercase: true, default: '' },
        deliveryZones: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
        isAvailable: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
        approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
        approvedAt: { type: Date, default: null },
        rejectedAt: { type: Date, default: null },
        rejectionReason: { type: String, trim: true, maxlength: 200, default: '' },
        joiningDate: { type: Date, default: Date.now },
        totalDeliveries: { type: Number, min: 0, default: 0 },
        currentLocation: {
            latitude: { type: Number, min: -90, max: 90, default: null },
            longitude: { type: Number, min: -180, max: 180, default: null },
            heading: { type: Number, min: 0, max: 360, default: null },
            updatedAt: { type: Date, default: null },
        },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

// Unique only among non-deleted riders, and only when a real value exists
riderSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
riderSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, email: { $type: 'string', $gt: '' } } });
riderSchema.index({ vehicleNumber: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, vehicleNumber: { $type: 'string', $gt: '' } } });
// Listing and assignment screens
riderSchema.index({ isDeleted: 1, createdAt: -1 });
riderSchema.index({ isDeleted: 1, isActive: 1, isAvailable: 1, deliveryZones: 1 });
riderSchema.index({ isDeleted: 1, approvalStatus: 1, createdAt: -1 });

export const Rider = mongoose.model('Rider', riderSchema, 'riders');