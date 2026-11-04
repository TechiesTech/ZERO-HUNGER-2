import mongoose from 'mongoose';
const { Schema } = mongoose;

const kitchenSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        address: { type: String, trim: true, maxlength: 200 },
        location: {
            latitude: { type: Number, min: -90, max: 90 },
            longitude: { type: Number, min: -180, max: 180 },
        },
        passwordHash: { type: String, required: true, select: false },
        isActive: { type: Boolean, default: true },
        tokenVersion: { type: Number, default: 0 },
    },
    { timestamps: true, versionKey: false }
);

kitchenSchema.index({ email: 1 }, { unique: true });

export const Kitchen = mongoose.model('Kitchen', kitchenSchema, 'kitchens');