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

const getAllRiders = async ({ page, limit, zone, isAvailable, isActive }) => {
    const filter = { isDeleted: false };
    if (zone) filter.deliveryZones = zone;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;
    if (isActive !== undefined) filter.isActive = isActive;

    const [riders, total] = await Promise.all([
        Rider.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Rider.countDocuments(filter),
    ]);
    return { riders, total };
};

const getRiderById = (riderId) => Rider.findOne({ _id: riderId, isDeleted: false }).lean();

const deleteRider = (riderId) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date(), isActive: false, isAvailable: false } },
        { new: true }
    ).lean();

export {
    createRider,
    updateLocationById,
    updateRiderById,
    getAllRiders,
    getRiderById,
    deleteRider,
};