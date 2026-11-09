import mongoose from 'mongoose';
const { Schema } = mongoose;

const kitchenSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        address: { type: String, required: true, trim: true, maxlength: 200 },
        location: {
            latitude: { type: Number, min: -90, max: 90, required: true },
            longitude: { type: Number, min: -180, max: 180, required: true },
        },
    },
    { timestamps: true, versionKey: false }
);

export const Kitchen = mongoose.model('Kitchen', kitchenSchema, 'kitchens');