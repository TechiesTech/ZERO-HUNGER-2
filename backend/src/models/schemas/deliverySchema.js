import mongoose from 'mongoose';

const { Schema } = mongoose;

const deliverySchema = new Schema(
    {
        orderId: { type: Schema.Types.ObjectId, ref: 'Orders', required: true },
        riderId: { type: Schema.Types.ObjectId, ref: 'Rider', required: true },
        status: {
            type: String,
            enum: ['assigned', 'accepted', 'pickedup', 'delivered', 'rejected', 'cancelled'],
            default: 'assigned',
        },
        isOpen: { type: Boolean, default: true },
        assignedAt: { type: Date, default: Date.now },
        acceptedAt: { type: Date, default: null },
        pickedUpAt: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
        releasedAt: { type: Date, default: null },
        releasedBy: { type: String, enum: ['rider', 'admin'], default: null },
        photoUrl: { type: String, trim: true, default: '' },
        photoPublicId: { type: String, trim: true, default: '' },
    },
    { timestamps: true, versionKey: false }
);

deliverySchema.index(
    { orderId: 1 },
    { unique: true, partialFilterExpression: { isOpen: true } }
);
deliverySchema.index(
    { riderId: 1 },
    { unique: true, partialFilterExpression: { isOpen: true } }
);
deliverySchema.index({ orderId: 1, createdAt: 1 });
deliverySchema.index({ riderId: 1, createdAt: -1 });

export const Delivery = mongoose.model('Delivery', deliverySchema, 'deliveries');
