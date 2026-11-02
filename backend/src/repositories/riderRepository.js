import { Rider } from '../models/schemas/riderSchema.js';

const createRider = async (data) => {
    const now = new Date();
    const { value, lastErrorObject } = await Rider.findOneAndUpdate(
        {
            isDeleted: false,
            $or: [
                { phone: data.phone },
                ...(data.email ? [{ email: data.email }] : []),
                ...(data.vehicleNumber ? [{ vehicleNumber: data.vehicleNumber }] : []),
            ],
        },
        { $setOnInsert: { ...data, createdAt: now, updatedAt: now } },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
            timestamps: false,
            includeResultMetadata: true,
        }
    ).lean();
    return { rider: value, isDuplicate: lastErrorObject.updatedExisting };
};

const updateLocationById = (riderId, { latitude, longitude, heading }) =>
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

const updateRiderById = (riderId, updates) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false },
        { $set: updates },
        { new: true, runValidators: true }
    ).lean();

export {
    createRider,
    updateLocationById,
    updateRiderById,
};