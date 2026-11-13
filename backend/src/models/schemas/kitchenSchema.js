import mongoose from 'mongoose';
const { Schema } = mongoose;

const kitchenSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        address: {
            addressLine1: { type: String, required: true, trim: true, maxlength: 200 },
            area: { type: String, required: true, trim: true, maxlength: 100 },
            landmark: { type: String, trim: true, default: '', maxlength: 100 },
            city: { type: String, required: true, trim: true, maxlength: 80 },
            state: { type: String, required: true, trim: true, maxlength: 80 },
            pincode: { type: String, required: true, trim: true, match: /^\d{6}$/ },
        },
        location: {
            latitude: { type: Number, min: -90, max: 90, required: true },
            longitude: { type: Number, min: -180, max: 180, required: true },
        },
        serviceRadiusKm: { type: Number, min: 0.5, max: 50, default: 5 },
        isOpen: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false }
);

kitchenSchema.index({ isOpen: 1 });
kitchenSchema.index({ 'address.city': 1, 'address.pincode': 1 });

export const Kitchen = mongoose.model('Kitchen', kitchenSchema, 'kitchens');