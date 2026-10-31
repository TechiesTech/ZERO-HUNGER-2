import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema(
    {
        orderId: { type: Schema.Types.ObjectId, ref: 'Orders', required: true },
        mealId: { type: Schema.Types.ObjectId, ref: 'Meals', required: true },
        productName: { type: String, required: true, trim: true, maxlength: 80 },
        quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
        unitPriceInr: { type: Number, required: true, min: 1, validate: Number.isInteger },
        totalPriceInr: { type: Number, required: true, min: 1, validate: Number.isInteger },
        isEligibleBuyOneGiveOne: { type: Boolean, required: true },
        sponsoredChildMeals: { type: Number, required: true, min: 0, validate: Number.isInteger },
    },
    { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ mealId: 1 });

const OrderItem = mongoose.model('OrderItems', orderItemSchema, 'orderItems');

export { OrderItem };