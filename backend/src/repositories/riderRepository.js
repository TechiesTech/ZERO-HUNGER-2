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

const getRider = async (userId) => {
    return Rider.findOne({ userId }).select('isAvailable').lean();
};

const setAvailability = async (userId, isAvailable) => {
    return Rider.findOneAndUpdate({ userId }, { $set: { isAvailable } }, { new: true })
        .select('isAvailable')
        .lean();
};

const updateLocation = async (userId, latitude, longitude, heading) => {
    return Rider.findOneAndUpdate(
        { userId },
        { $set: { currentLocation: { latitude, longitude, heading, updatedAt: new Date() } } },
        { new: true }
    )
        .select('currentLocation')
        .lean();
};

const getAvailableOrders = async () => {
    return Order.aggregate([
        { $match: { customerMealStatus: 'readyforpickup', assignedRiderId: null, isDeleted: false } },
        { $sort: { createdAt: 1 } },
        { $limit: 20 },
        {
            $lookup: {
                from: 'addresses',
                localField: 'customerId',
                foreignField: 'userId',
                let: { orderAddressId: '$addressId' },
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
        {
            $lookup: {
                from: 'kitchens',
                localField: 'kitchenId',
                foreignField: '_id',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            pipeline: [{ $project: { _id: 0, name: 1 } }],
                            as: 'account',
                        },
                    },
                    { $project: { _id: 0, name: { $arrayElemAt: ['$account.name', 0] }, address: 1, location: 1 } },
                ],
                as: 'kitchen',
            },
        },
        {
            $project: {
                _id: 0,
                orderNumber: 1,
                totalAmountInr: 1,
                createdAt: 1,
                deliveryArea: { $arrayElemAt: ['$savedAddress.address.area', 0] },
                deliveryLocation: { $arrayElemAt: ['$savedAddress.address.location', 0] },
                kitchen: { $arrayElemAt: ['$kitchen', 0] },
            },
        },
    ]);
};

const acceptOrder = async (riderId, orderNumber) => {
    const order = await Order.findOneAndUpdate(
        { orderNumber, isDeleted: false, customerMealStatus: 'readyforpickup', assignedRiderId: null },
        { $set: { assignedRiderId: riderId } },
        { new: true }
    )
        .select('orderNumber')
        .lean();

    if (!order) return null;

    try {
        await Delivery.create({ orderId: order._id, riderId });
    } catch (error) {
        await Order.updateOne({ _id: order._id }, { $set: { assignedRiderId: null } });
        throw error;
    }

    return { orderNumber: order.orderNumber, status: 'accepted' };
};

const updateStatus = async (riderId, orderNumber, status, photoKey) => {
    const flow = statusFlow[status];
    const updatedAt = new Date();

    const order = await Order.findOneAndUpdate(
        { orderNumber, assignedRiderId: riderId, isDeleted: false, customerMealStatus: flow.from },
        { $set: { customerMealStatus: flow.to, [flow.orderTimeField]: updatedAt } },
        { new: true }
    )
        .select('orderNumber customerMealStatus')
        .lean();

    if (!order) return null;

    if (status === 'pickedup') {
        await Delivery.updateOne(
            { orderId: order._id, riderId, isOpen: true },
            { $set: { status, [flow.deliveryTimeField]: updatedAt } }
        );
        return { ...order, updatedAt };
    }

    await Promise.all([
        Delivery.updateOne(
            { orderId: order._id, riderId, isOpen: true },
            { $set: { status, isOpen: false, [flow.deliveryTimeField]: updatedAt, photoKey } }
        ),
        Rider.updateOne({ _id: riderId }, { $inc: { totalDeliveries: 1 } }),
    ]);

    return { ...order, updatedAt };
};

const currentDelivery = async (userId) => {
    const [delivery] = await Rider.aggregate([
        { $match: { userId } },
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
        {
            $lookup: {
                from: 'addresses',
                localField: 'order.customerId',
                foreignField: 'userId',
                let: { orderAddressId: '$order.addressId' },
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
        {
            $lookup: {
                from: 'kitchens',
                localField: 'order.kitchenId',
                foreignField: '_id',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            pipeline: [{ $project: { _id: 0, name: 1 } }],
                            as: 'account',
                        },
                    },
                    { $project: { _id: 0, name: { $arrayElemAt: ['$account.name', 0] }, address: 1, location: 1 } },
                ],
                as: 'kitchen',
            },
        },
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
        { $match: { userId } },
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
                                {
                                    $lookup: {
                                        from: 'addresses',
                                        localField: 'order.customerId',
                                        foreignField: 'userId',
                                        let: { orderAddressId: '$order.addressId' },
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
                                {
                                    $project: {
                                        _id: 0,
                                        orderNumber: '$order.orderNumber',
                                        deliveredAt: 1,
                                        area: { $arrayElemAt: ['$savedAddress.address.area', 0] },
                                        photoKey: 1,
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
    getRider,
    setAvailability,
    updateLocation,
    getAvailableOrders,
    acceptOrder,
    updateStatus,
    currentDelivery,
    getMyDeliveries,
    getRiderStats,
    getAllRiders,
    reviewRider,
};