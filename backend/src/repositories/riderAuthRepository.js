import { Rider } from '../models/schemas/riderSchema.js';

const login = (phone) =>
    Rider.findOne({ phone, isDeleted: false }).select('+passwordHash').lean();

const verifyToken = (riderId) =>
    Rider.findOne({ _id: riderId, isDeleted: false, isActive: true })
        .select('name phone vehicleType tokenVersion')
        .lean();

const logout = (riderId) =>
    Rider.updateOne({ _id: riderId }, { $inc: { tokenVersion: 1 } });

const setPassword = (riderId, passwordHash) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false },
        { $set: { passwordHash }, $inc: { tokenVersion: 1 } },
        { new: true }
    )
        .select('_id')
        .lean();

const updateRiderLocation = (riderId, { latitude, longitude, heading }) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false, isActive: true },
        {
            $set: {
                'currentLocation.latitude': latitude,
                'currentLocation.longitude': longitude,
                'currentLocation.heading': heading ?? null,
                'currentLocation.updatedAt': new Date(),
            },
        },
        { new: true, runValidators: true }
    ).lean();

export { login, verifyToken, logout, setPassword, updateRiderLocation };
