import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentSchema = new Schema(
    {
        orderId: { type: Schema.Types.ObjectId, ref: 'Orders', required: true },
        amountInr: { type: Number, required: true, min: 1, validate: Number.isInteger },
        method: { type: String, required: true, enum: ['upi', 'card', 'netbanking'] },
        status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
        gatewayName: { type: String, trim: true, default: '' },
        gatewayOrderId: { type: String, trim: true, default: '' },
        transactionReference: { type: String, trim: true, default: '' },
        gatewayResponse: { type: Schema.Types.Mixed, default: null },
        paidAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index(
    { transactionReference: 1 },
    { unique: true, partialFilterExpression: { transactionReference: { $gt: '' } } }
);
paymentSchema.index(
    { gatewayOrderId: 1 },
    { partialFilterExpression: { gatewayOrderId: { $gt: '' } } }
);

const Payment = mongoose.model('Payments', paymentSchema, 'payments');

export { Payment };