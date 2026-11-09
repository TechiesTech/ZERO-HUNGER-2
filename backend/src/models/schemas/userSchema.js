import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true }, // stored as 10 digits
        passwordHash: { type: String, select: false },
        roles: {
            type: [{ type: String, enum: ['admin', 'kitchen', 'rider', 'customer'] }],
            validate: [(v) => v.length > 0, 'At least one role is required'],
        },
        // unverified = email code not entered yet, pending = rider waiting for admin approval
        status: {
            type: String,
            enum: ['unverified', 'pending', 'active', 'rejected', 'suspended'],
            default: 'unverified',
        },
        rejectionReason: { type: String, default: '' },
        mustChangePassword: { type: Boolean, default: false },
        tokenVersion: { type: Number, default: 0 },
        failedLoginAttempts: { type: Number, default: 0 },
        lockedUntil: { type: Date, default: null },
        // One live email code per account, stored hashed
        codeHash: { type: String, select: false },
        codeExpires: { type: Date },
        codeAttempts: { type: Number, default: 0 },
    },
    { timestamps: true, versionKey: false }
);

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

export const User = mongoose.model('User', userSchema, 'users');