import mongoose from 'mongoose';
import AppError from '../utils/appError.js';
import { User } from '../models/schemas/userSchema.js';
import { Rider } from '../models/schemas/riderSchema.js';
import { Order } from '../models/schemas/orderSchema.js';
import { Delivery } from '../models/schemas/deliverySchema.js';

const statusFlow = {
    pickedup: {
        from: 'readyforpickup',
        to: 'outfordelivery',
        orderTimeField: 'statusTimestamps.outForDeliveryAt',
        deliveryTimeField: 'pickedUpAt',
    },
    delivered: {
        from: 'outfordelivery',
        to: 'delivered',
        orderTimeField: 'statusTimestamps.deliveredAt',
        deliveryTimeField: 'deliveredAt',
    },
};

// The Order only stores addressId. The address itself is an element inside the customer's
// addresses array, so it is looked up here and put on the document as deliveryAddress.
// prefix is '' when the order is the root document, and 'order.' when it sits under $order.
// Deleted addresses stay in the array, so old orders still find theirs.
const addressStages = (prefix = '') => [
    {
        $lookup: {
            from: 'addresses',
            localField: `${prefix}customerId`,
            foreignField: 'userId',
            let: { orderAddressId: `$${prefix}addressId` },
            pipeline: [
                {
                    $project: {
                        _id: 0,
                        address: {
                            $arrayElemAt: [
                                {
                                    $filter: {
                                        input: '$addresses',
                                        as: 'saved',
                                        cond: { $eq: ['$$saved._id', '$$orderAddressId'] },
                                    },
                                },
                                0,
                            ],
                        },
                    },
                },
            ],
            as: 'savedAddress',
        },
    },
    { $set: { deliveryAddress: { $arrayElemAt: ['$savedAddress.address', 0] } } },
];

// Kitchen name, phone, address and location. localField is the path of the kitchen id.
const kitchenLookup = (localField) => ({
    $lookup: {
        from: 'kitchens',
        localField,
        foreignField: '_id',
        pipeline: [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    pipeline: [{ $project: { _id: 0, name: 1, phone: 1 } }],
                    as: 'account',
                },
            },
            {
                $project: {
                    _id: 0,
                    name: { $arrayElemAt: ['$account.name', 0] },
                    phone: { $arrayElemAt: ['$account.phone', 0] },
                    address: 1,
                    location: 1,
                },
            },
        ],
        as: 'kitchen',
    },
});

const registerRider = async ({ name, email, phone, passwordHash, vehicleType, vehicleNumber }) => {
    const user = await User.create({ name, email, phone, passwordHash, roles: ['rider'], status: 'pending' });
    try {
        await Rider.create({ userId: user._id, vehicleType, vehicleNumber });
    } catch (error) {
        await User.deleteOne({ _id: user._id });
        throw error;
    }
    return { name: user.name, email: user.email, status: user.status };
};

const getRider = async (userId) => {
    return Rider.findOne({ userId }).select('isAvailable').lean();
};

const getRiderProfile = async (userId) => {
    return Rider.findOne({ userId })
        .select('isAvailable vehicleType vehicleNumber currentLocation')
        .lean();
};

const setAvailability = async (userId, isAvailable) => {
    return Rider.findOneAndUpdate({ userId }, { $set: { isAvailable } }, { new: true })
        .select('isAvailable')
        .lean();
};

// Only an online rider can save a location
const updateLocation = async (userId, latitude, longitude, heading) => {
    return Rider.findOneAndUpdate(
        { userId, isAvailable: true },
        { $set: { currentLocation: { latitude, longitude, heading, updatedAt: new Date() } } },
        { new: true }
    )
        .select('currentLocation')
        .lean();
};

const hasOpenDelivery = async (riderId) => Boolean(await Delivery.exists({ riderId, isOpen: true }));

const getAvailableOrders = async () => {
    return Order.aggregate([
        { $match: { customerMealStatus: 'readyforpickup', assignedRiderId: null, isDeleted: false } },
        { $sort: { createdAt: 1 } },
        { $limit: 20 },
        ...addressStages(),
        kitchenLookup('kitchenId'),
        {
            $project: {
                _id: 0,
                orderNumber: 1,
                totalAmountInr: 1,
                createdAt: 1,
                deliveryArea: '$deliveryAddress.area',
                deliveryLocation: '$deliveryAddress.location',
                kitchen: { $arrayElemAt: ['$kitchen', 0] },
            },
        },
    ]);
};

const acceptOrder = async (riderId, orderNumber) => {
    let result = null;

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            result = null; // reset, because this function can run more than once

            const order = await Order.findOneAndUpdate(
                { orderNumber, isDeleted: false, customerMealStatus: 'readyforpickup', assignedRiderId: null },
                { $set: { assignedRiderId: riderId } },
                { new: true, session }
            )
                .select('orderNumber customerId kitchenId')
                .lean();

            if (!order) return;

            // A rider with an open delivery fails here with code 11000 and the assignment is rolled back
            await Delivery.create(
                [{ orderId: order._id, riderId, status: 'accepted', acceptedAt: new Date() }],
                { session }
            );

            result = {
                orderNumber: order.orderNumber,
                status: 'accepted',
                customerId: order.customerId,
                kitchenId: order.kitchenId,
            };
        });
    } finally {
        await session.endSession();
    }

    return result;
};

const updateStatus = async (riderId, orderNumber, status, photoPublicId, photoUrl) => {
    const flow = statusFlow[status];
    const updatedAt = new Date();
    let result = null;

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            result = null; // reset, because this function can run more than once

            const order = await Order.findOneAndUpdate(
                { orderNumber, assignedRiderId: riderId, isDeleted: false, customerMealStatus: flow.from },
                { $set: { customerMealStatus: flow.to, [flow.orderTimeField]: updatedAt } },
                { new: true, session }
            )
                .select('orderNumber customerMealStatus customerId kitchenId')
                .lean();

            if (!order) return;

            const deliveryChanges = { status, [flow.deliveryTimeField]: updatedAt };
            if (status === 'delivered') {
                Object.assign(deliveryChanges, { isOpen: false, photoPublicId, photoUrl });
            }

            const delivery = await Delivery.updateOne(
                { orderId: order._id, riderId, isOpen: true },
                { $set: deliveryChanges },
                { session }
            );

            // Without a delivery record the order must not move, so everything is rolled back
            if (delivery.matchedCount === 0) {
                throw new AppError('Open delivery not found for this order', 409);
            }

            if (status === 'delivered') {
                await Rider.updateOne({ _id: riderId }, { $inc: { totalDeliveries: 1 } }, { session });
            }

            result = { ...order, updatedAt };
        });
    } finally {
        await session.endSession();
    }

    return result;
};

const releaseOrder = async (riderId, orderNumber) => {
    let result = null;

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            result = null;

            const order = await Order.findOneAndUpdate(
                { orderNumber, assignedRiderId: riderId, isDeleted: false, customerMealStatus: 'readyforpickup' },
                { $set: { assignedRiderId: null } },
                { new: true, session }
            )
                .select('orderNumber customerId kitchenId')
                .lean();

            if (!order) return;

            const delivery = await Delivery.updateOne(
                { orderId: order._id, riderId, isOpen: true, status: 'accepted' },
                { $set: { status: 'cancelled', isOpen: false, releasedAt: new Date(), releasedBy: 'rider' } },
                { session }
            );

            if (delivery.matchedCount === 0) {
                throw new AppError('Open delivery not found for this order', 409);
            }

            result = {
                orderNumber: order.orderNumber,
                status: 'released',
                customerId: order.customerId,
                kitchenId: order.kitchenId,
            };
        });
    } finally {
        await session.endSession();
    }

    return result;
};

const currentDelivery = async (userId) => {
    const [delivery] = await Rider.aggregate([
        // aggregate does not cast ids, so convert to ObjectId
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: 'deliveries',
                localField: '_id',
                foreignField: 'riderId',
                pipeline: [{ $match: { isOpen: true } }, { $limit: 1 }],
                as: 'delivery',
            },
        },
        { $set: { delivery: { $arrayElemAt: ['$delivery', 0] } } },
        { $match: { delivery: { $exists: true } } },
        { $lookup: { from: 'orders', localField: 'delivery.orderId', foreignField: '_id', as: 'order' } },
        { $set: { order: { $arrayElemAt: ['$order', 0] } } },
        ...addressStages('order.'),
        kitchenLookup('order.kitchenId'),
        {
            $project: {
                _id: 0,
                orderNumber: '$order.orderNumber',
                status: '$delivery.status',
                customerMealStatus: '$order.customerMealStatus',
                totalAmountInr: '$order.totalAmountInr',
                acceptedAt: '$delivery.acceptedAt',
                pickedUpAt: '$delivery.pickedUpAt',
                customerName: '$deliveryAddress.customerName',
                customerPhone: '$deliveryAddress.customerPhone',
                deliveryAddress: {
                    addressLine1: '$deliveryAddress.addressLine1',
                    addressLine2: '$deliveryAddress.addressLine2',
                    area: '$deliveryAddress.area',
                    landmark: '$deliveryAddress.landmark',
                    city: '$deliveryAddress.city',
                    state: '$deliveryAddress.state',
                    pincode: '$deliveryAddress.pincode',
                    location: '$deliveryAddress.location',
                },
                kitchen: { $arrayElemAt: ['$kitchen', 0] },
            },
        },
    ]);

    return delivery || null;
};

const getMyDeliveries = async (userId, from, to, skip, limit) => {
    const [rider] = await Rider.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: 'deliveries',
                localField: '_id',
                foreignField: 'riderId',
                pipeline: [
                    { $match: { deliveredAt: { $gte: from, $lt: to } } },
                    { $sort: { deliveredAt: -1 } },
                    {
                        $facet: {
                            total: [{ $count: 'count' }],
                            deliveries: [
                                { $skip: skip },
                                { $limit: limit },
                                { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
                                { $set: { order: { $arrayElemAt: ['$order', 0] } } },
                                ...addressStages('order.'),
                                {
                                    $project: {
                                        _id: 0,
                                        orderNumber: '$order.orderNumber',
                                        deliveredAt: 1,
                                        area: '$deliveryAddress.area',
                                        photoUrl: 1,
                                        photoPublicId: 1,
                                    },
                                },
                            ],
                        },
                    },
                ],
                as: 'report',
            },
        },
        { $project: { _id: 0, report: { $arrayElemAt: ['$report', 0] } } },
    ]);

    return rider?.report || null;
};

const getRiderStats = async (since) => {
    const [stats] = await User.aggregate([
        { $match: { roles: 'rider' } },
        { $lookup: { from: 'riders', localField: '_id', foreignField: 'userId', as: 'rider' } },
        { $set: { rider: { $arrayElemAt: ['$rider', 0] } } },
        {
            $lookup: {
                from: 'deliveries',
                localField: 'rider._id',
                foreignField: 'riderId',
                pipeline: [{ $match: { isOpen: true } }, { $limit: 1 }],
                as: 'openDelivery',
            },
        },
        {
            $set: {
                isLive: {
                    $and: [
                        { $eq: ['$status', 'active'] },
                        { $eq: ['$rider.isAvailable', true] },
                        { $gte: ['$rider.currentLocation.updatedAt', since] },
                    ],
                },
                isBusy: { $gt: [{ $size: '$openDelivery' }, 0] },
            },
        },
        {
            $group: {
                _id: null,
                totalRiders: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                live: { $sum: { $cond: ['$isLive', 1, 0] } },
                busy: { $sum: { $cond: [{ $and: ['$isLive', '$isBusy'] }, 1, 0] } },
            },
        },
        { $project: { _id: 0 } },
    ]);

    return stats || { totalRiders: 0, pending: 0, active: 0, live: 0, busy: 0 };
};

const getAllRiders = async (status, since, skip, limit) => {
    const filters = {
        pending: { status: 'pending' },
        active: { status: 'active' },
        live: { isLive: true },
        busy: { isLive: true, isBusy: true },
        free: { isLive: true, isBusy: false },
    };

    const [result] = await User.aggregate([
        { $match: { roles: 'rider' } },
        { $lookup: { from: 'riders', localField: '_id', foreignField: 'userId', as: 'rider' } },
        { $set: { rider: { $arrayElemAt: ['$rider', 0] } } },
        {
            $lookup: {
                from: 'deliveries',
                localField: 'rider._id',
                foreignField: 'riderId',
                pipeline: [
                    { $match: { isOpen: true } },
                    { $limit: 1 },
                    { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
                    { $project: { _id: 0, orderNumber: { $arrayElemAt: ['$order.orderNumber', 0] } } },
                ],
                as: 'openDelivery',
            },
        },
        {
            $set: {
                isLive: {
                    $and: [
                        { $eq: ['$status', 'active'] },
                        { $eq: ['$rider.isAvailable', true] },
                        { $gte: ['$rider.currentLocation.updatedAt', since] },
                    ],
                },
                isBusy: { $gt: [{ $size: '$openDelivery' }, 0] },
            },
        },
        { $match: filters[status] || {} },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                riders: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 0,
                            userId: '$_id',
                            name: 1,
                            email: 1,
                            phone: 1,
                            status: 1,
                            vehicleType: '$rider.vehicleType',
                            vehicleNumber: '$rider.vehicleNumber',
                            totalDeliveries: '$rider.totalDeliveries',
                            lastLocationAt: '$rider.currentLocation.updatedAt',
                            isLive: 1,
                            isBusy: 1,
                            currentOrderNumber: { $arrayElemAt: ['$openDelivery.orderNumber', 0] },
                        },
                    },
                ],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    return { riders: result.riders, total: result.total[0]?.count || 0 };
};

const reviewRider = async (userId, status, reason) => {
    return User.findOneAndUpdate(
        { _id: userId, roles: 'rider', status: 'pending' },
        { $set: { status, rejectionReason: reason ?? '' } },
        { new: true }
    )
        .select('name email status rejectionReason')
        .lean();
};

export {
    registerRider,
    getRider,
    getRiderProfile,
    setAvailability,
    updateLocation,
    hasOpenDelivery,
    getAvailableOrders,
    acceptOrder,
    updateStatus,
    releaseOrder,
    currentDelivery,
    getMyDeliveries,
    getRiderStats,
    getAllRiders,
    reviewRider,
};