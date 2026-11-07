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

const updateRiderById = (riderId, updates) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false },
        { $set: updates },
        { new: true, runValidators: true }
    ).lean();

const getAllRiders = async ({ page, limit, zone, isAvailable, isActive, approvalStatus }) => {
    const filter = { isDeleted: false };
    if (zone) filter.deliveryZones = zone;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;
    if (isActive !== undefined) filter.isActive = isActive;
    if (approvalStatus === 'approved') filter.approvalStatus = { $nin: ['pending', 'rejected'] };
    else if (approvalStatus) filter.approvalStatus = approvalStatus;

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

// NEW: only safe fields, so phone and email never reach customers
const getRiderForTracking = (riderId) =>
    Rider.findOne({ _id: riderId, isDeleted: false })
        .select('name vehicleType currentLocation')
        .lean();

const approveRider = (riderId) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false, approvalStatus: { $in: ['pending', 'rejected'] } },
        {
            $set: {
                approvalStatus: 'approved',
                approvedAt: new Date(),
                rejectedAt: null,
                rejectionReason: '',
                isActive: true,
                isAvailable: true,
            },
        },
        { new: true }
    ).lean();

const rejectRider = (riderId, reason) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false, approvalStatus: { $ne: 'rejected' } },
        {
            $set: {
                approvalStatus: 'rejected',
                rejectedAt: new Date(),
                rejectionReason: reason || '',
                isAvailable: false,
            },
            $inc: { tokenVersion: 1 }, // logs the rider out
        },
        { new: true }
    ).lean();

export {
    createRider,
    updateRiderById,
    getAllRiders,
    getRiderById,
    deleteRider,
    getRiderForTracking,
    approveRider,
    rejectRider,
};