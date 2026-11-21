import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        addresses: [
            {
                label: { type: String, trim: true, lowercase: true, enum: ['home', 'work', 'other'], default: 'home' },
                customerName: { type: String, trim: true, required: true },
                customerPhone: { type: String, trim: true, default: '' },
                addressLine1: { type: String, trim: true, required: true },
                addressLine2: { type: String, trim: true, default: '' },
                area: { type: String, trim: true, required: true },
                landmark: { type: String, trim: true, default: '' },
                city: { type: String, trim: true, required: true },
                state: { type: String, trim: true, required: true },
                pincode: { type: String, trim: true, required: true },
                location: {
                    latitude: { type: Number, required: true },
                    longitude: { type: Number, required: true },
                },
                isDefault: { type: Boolean, default: false },

                // Never removed from the array, because old orders still point to it
                isDeleted: { type: Boolean, default: false },
            },
        ],
    },
    { timestamps: true }
);

addressSchema.index({ userId: 1 }, { unique: true });
addressSchema.index({ 'addresses._id': 1 });
export const Address = mongoose.model('Address', addressSchema, 'addresses');