import mongoose from 'mongoose';
const { Schema } = mongoose;
const adminSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        email: { type: String, required: true, trim: true, lowercase: true },
        passwordHash: { type: String, required: true, select: false },
        isActive: { type: Boolean, default: true },
        tokenVersion: { type: Number, default: 0 },
    },
    { timestamps: true, versionKey: false }
);

adminSchema.index({ email: 1 }, { unique: true });

export const Admin = mongoose.model('Admins', adminSchema, 'admins');