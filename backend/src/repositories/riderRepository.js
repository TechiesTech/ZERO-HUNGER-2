import mongoose from 'mongoose';
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
    )
        .select('-passwordHash -tokenVersion')
        .lean();

const updateRiderLocation = (riderId, { latitude, longitude, heading }) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false },
        {
            $set: {
                'currentLocation.latitude': latitude,
                'currentLocation.longitude': longitude,
                'currentLocation.heading': heading ?? null,
                'currentLocation.updatedAt': new Date(),
            },
        },
        { new: true, runValidators: true }
    )
        .select('-passwordHash -tokenVersion')
        .lean();

const getAllRiders = async ({ page, limit, zone, isAvailable, isActive, approvalStatus }) => {
    const filter = { isDeleted: false };
    if (zone) filter.deliveryZones = zone;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;
    if (approvalStatus === 'approved') filter.approvalStatus = { $nin: ['pending', 'rejected'] };
    else if (approvalStatus) filter.approvalStatus = approvalStatus;

    const [result] = await Rider.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: 'users',
                let: { riderId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$riderId'] },
                                    { $in: ['rider', { $ifNull: ['$roles', []] }] },
                                ],
                            },
                        },
                    },
                    { $project: { status: 1 } },
                ],
                as: 'account',
            },
        },
        { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
        { $addFields: { isActive: { $eq: ['$account.status', 'active'] } } },
        ...(isActive === undefined ? [] : [{ $match: { isActive } }]),
        {
            $facet: {
                riders: [
                    { $sort: { createdAt: -1 } },
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    { $project: { account: 0, passwordHash: 0, tokenVersion: 0, lockedUntil: 0, failedLoginAttempts: 0 } },
                ],
                metadata: [{ $count: 'total' }],
            },
        },
    ]);
    return { riders: result?.riders || [], total: result?.metadata[0]?.total || 0 };
};

const getRiderById = async (riderId) => {
    const [rider] = await Rider.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(riderId), isDeleted: false } },
        {
            $lookup: {
                from: 'users',
                let: { riderId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$riderId'] },
                                    { $in: ['rider', { $ifNull: ['$roles', []] }] },
                                ],
                            },
                        },
                    },
                    { $project: { status: 1 } },
                ],
                as: 'account',
            },
        },
        { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
        { $addFields: { isActive: { $eq: ['$account.status', 'active'] } } },
        { $project: { account: 0, passwordHash: 0, tokenVersion: 0, lockedUntil: 0, failedLoginAttempts: 0 } },
    ]);
    return rider;
};

const deleteRider = (riderId) =>
    Rider.findOneAndUpdate(
        { _id: riderId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date(), isAvailable: false } },
        { new: true }
    ).lean();

// NEW: only safe fields, so phone and email never reach customers
const getRiderForTracking = (riderId) =>
    Rider.findOne({ _id: riderId, isDeleted: false })
        .select('name vehicleType currentLocation')
        .lean();

// status is 'approved' or 'rejected'
const reviewRider = (riderId, status, reason) => {
    const approving = status === 'approved';
    return Rider.findOneAndUpdate(
        {
            _id: riderId,
            isDeleted: false,
            approvalStatus: approving ? { $in: ['pending', 'rejected'] } : { $ne: 'rejected' },
        },
        approving
            ? {
                $set: {
                    approvalStatus: 'approved',
                    approvedAt: new Date(),
                    rejectedAt: null,
                    rejectionReason: '',
                    isAvailable: true,
                },
            }
            : {
                $set: {
                    approvalStatus: 'rejected',
                    rejectedAt: new Date(),
                    rejectionReason: reason || '',
                    isAvailable: false,
                },
            },
        { new: true }
    )
            .select('-passwordHash -tokenVersion -lockedUntil -failedLoginAttempts')
            .lean();
};

export {
    createRider,
    updateRiderById,
    updateRiderLocation,
    getAllRiders,
    getRiderById,
    deleteRider,
    getRiderForTracking,
    reviewRider,
};