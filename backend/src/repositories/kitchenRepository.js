import { Kitchen } from '../models/schemas/kitchenSchema.js';
import { User } from '../models/schemas/userSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { OrderItem } from '../models/schemas/orderItemSchema.js';

const getMyKitchen = (kitchenId) =>
    Kitchen.findById(kitchenId).select('address location serviceRadiusKm isOpen').lean();

const saveMyKitchen = (kitchenId, data) =>
    Kitchen.findOneAndUpdate(
        { _id: kitchenId },
        { $set: data, $setOnInsert: { user: kitchenId } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

const getAllKitchens = async ({ search, isActive, page, limit }) => {
    const match = { roles: 'kitchen' };
    if (isActive !== undefined) match.status = isActive ? 'active' : { $ne: 'active' };
    if (search) {
        const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        match.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
    }

    const [result] = await User.aggregate([
        { $match: match },
        {
            $facet: {
                kitchens: [
                    { $sort: { createdAt: -1, _id: -1 } },
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: 'kitchens',
                            localField: '_id',
                            foreignField: '_id',
                            pipeline: [{ $project: { address: 1, location: 1, serviceRadiusKm: 1, isOpen: 1 } }],
                            as: 'details',
                        },
                    },
                    { $unwind: { path: '$details', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            name: 1,
                            email: 1,
                            phone: 1,
                            status: 1,
                            mustChangePassword: 1,
                            createdAt: 1,
                            isActive: { $eq: ['$status', 'active'] },
                            address: '$details.address',
                            location: '$details.location',
                            serviceRadiusKm: '$details.serviceRadiusKm',
                            isOpen: '$details.isOpen',
                            detailsComplete: { $ne: [{ $type: '$details' }, 'missing'] },
                        },
                    },
                ],
                metadata: [{ $count: 'total' }],
            },
        },
    ]);

    return { kitchens: result?.kitchens || [], total: result?.metadata[0]?.total || 0 };
};

const getActiveKitchens = () =>
    Kitchen.aggregate([
        { $match: { isOpen: { $ne: false } } },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                pipeline: [
                    { $match: { status: 'active', roles: 'kitchen' } },
                    { $project: { name: 1 } },
                ],
                as: 'account',
            },
        },
        {
            $addFields: {
                name: { $ifNull: [{ $arrayElemAt: ['$account.name', 0] }, '$address'] },
            },
        },
        {
            $project: {
                name: 1,
                address: 1,
                location: 1,
            },
        },
        { $sort: { name: 1 } },
    ]);

const getPaidOrders = (kitchenId) =>
    Order.aggregate([
        {
            $match: {
                kitchenId,
                isDeleted: false,
                paymentStatus: 'success',
                customerMealStatus: { $in: ['confirmed', 'preparing', 'readyforpickup'] },
            },
        },
        { $sort: { createdAt: 1 } },
        {
            $lookup: {
                from: OrderItem.collection.name,
                localField: '_id',
                foreignField: 'orderId',
                as: 'items',
            },
        },
    ]);

const moveOrderStatus = (orderId, kitchenId, from, to, stampField) =>
    Order.findOneAndUpdate(
        { _id: orderId, kitchenId, isDeleted: false, paymentStatus: 'success', customerMealStatus: from },
        { $set: { customerMealStatus: to, [`statusTimestamps.${stampField}`]: new Date() } },
        { new: true, runValidators: true }
    ).lean();

export { getMyKitchen, saveMyKitchen, getAllKitchens, getActiveKitchens, getPaidOrders, moveOrderStatus };