import mongoose from 'mongoose';
import { Order } from '../models/schemas/orderSchema.js';
import { Rider } from '../models/schemas/riderSchema.js';
import { User } from '../models/schemas/userSchema.js';
import { Delivery } from '../models/schemas/deliverySchema.js';
import cloudinary from '../config/cloudinary.js';

const assignRider = async (orderId, riderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const riderProfile = await Rider.findOne({
            _id: riderId,
            isDeleted: false,
            isAvailable: true,
        })
            .select('_id')
            .session(session)
            .lean();
        const account = riderProfile
            ? await User.findOne({ _id: riderId, roles: 'rider', status: 'active' })
                .select('_id')
                .session(session)
                .lean()
            : null;

        const order = account
            ? await Order.findOneAndUpdate(
                {
                    _id: orderId,
                    isDeleted: false,
                    paymentStatus: 'success',
                    assignedRiderId: null,
                    customerMealStatus: { $in: ['confirmed', 'preparing', 'readyforpickup'] },
                },
                { $set: { assignedRiderId: riderId } },
                { new: true, session }
            )
                .select('orderNumber customerMealStatus assignedRiderId')
                .lean()
            : null;

        if (!account || !order) {
            await session.abortTransaction();
            return { rider: account, order, delivery: null };
        }

        const [delivery] = await Delivery.create([{ orderId, riderId }], { session });
        await session.commitTransaction();
        return { rider: account, order, delivery: delivery.toObject() };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

const releaseRider = async (orderId, riderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const delivery = await Delivery.findOneAndUpdate(
            {
                orderId,
                isOpen: true,
                status: { $in: ['assigned', 'accepted'] },
                ...(riderId && { riderId }),
            },
            {
                $set: {
                    status: riderId ? 'rejected' : 'cancelled',
                    isOpen: false,
                    releasedAt: new Date(),
                    releasedBy: riderId ? 'rider' : 'admin',
                },
            },
            { new: true, session }
        )
            .select('orderId riderId')
            .lean();

        if (!delivery) {
            await session.abortTransaction();
            return null;
        }

        const order = await Order.findOneAndUpdate(
            {
                _id: delivery.orderId,
                assignedRiderId: delivery.riderId,
                isDeleted: false,
                customerMealStatus: { $in: ['confirmed', 'preparing', 'readyforpickup'] },
            },
            { $set: { assignedRiderId: null } },
            { new: true, session }
        )
            .select('orderNumber')
            .lean();

        if (!order) {
            await session.abortTransaction();
            return null;
        }

        await session.commitTransaction();
        return { orderNumber: order.orderNumber };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

const getMyActiveOrder = async (riderId) => {
    const [delivery] = await Delivery.aggregate([
        { $match: { riderId: new mongoose.Types.ObjectId(riderId), isOpen: true } },
        { $limit: 1 },
        { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
        { $set: { order: { $arrayElemAt: ['$order', 0] } } },
        { $lookup: { from: 'orderItems', localField: 'orderId', foreignField: 'orderId', as: 'items' } },
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
        },
        {
            $project: {
                _id: 0,
                orderId: 1,
                deliveryStatus: '$status',
                assignedAt: 1,
                acceptedAt: 1,
                pickedUpAt: 1,
                photoUrl: 1,
                orderNumber: '$order.orderNumber',
                orderStatus: '$order.customerMealStatus',
                customerName: '$order.customerName',
                customerPhone: '$order.customerPhone',
                deliveryAddress: '$order.deliveryAddress',
                deliveryLocation: '$order.deliveryAddress.location',
                estimatedDeliveryAt: '$order.estimatedDeliveryAt',
                totalAmountInr: '$order.totalAmountInr',
                kitchen: { $arrayElemAt: ['$kitchen', 0] },
                items: {
                    $map: {
                        input: '$items',
                        as: 'item',
                        in: { productName: '$$item.productName', quantity: '$$item.quantity' },
                    },
                },
            },
        },
    ]);

    return delivery || null;
};

const acceptOrder = async (orderId, riderId) =>
    Delivery.findOneAndUpdate(
        { orderId, riderId, isOpen: true, status: 'assigned' },
        { $set: { status: 'accepted', acceptedAt: new Date() } },
        { new: true }
    )
        .select('orderId status acceptedAt')
        .lean();

const markPickedUp = async (orderId, riderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const delivery = await Delivery.findOneAndUpdate(
            { orderId, riderId, isOpen: true, status: 'accepted' },
            { $set: { status: 'pickedup', pickedUpAt: new Date() } },
            { new: true, session }
        )
            .select('orderId status pickedUpAt')
            .lean();

        const order = delivery
            ? await Order.findOneAndUpdate(
                {
                    _id: orderId,
                    assignedRiderId: riderId,
                    isDeleted: false,
                    customerMealStatus: 'readyforpickup',
                },
                {
                    $set: {
                        customerMealStatus: 'outfordelivery',
                        'statusTimestamps.outForDeliveryAt': new Date(),
                        estimatedDeliveryAt: new Date(Date.now() + 30 * 60 * 1000),
                    },
                },
                { new: true, session }
            )
                .select('orderNumber customerMealStatus statusTimestamps estimatedDeliveryAt')
                .lean()
            : null;

        if (!delivery || !order) {
            await session.abortTransaction();
            return null;
        }

        await session.commitTransaction();
        return { ...order, deliveryStatus: delivery.status };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

const deleteUploadedPhoto = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
        console.error('Could not clean up delivery photo in Cloudinary:', error);
    }
};

const uploadDeliveryPhoto = async (fileBuffer, orderId, riderId) => {
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'zerohunger/deliveries',
                asset_folder: 'zerohunger/deliveries',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                resource_type: 'image',
            },
            (error, uploaded) => (error ? reject(error) : resolve(uploaded))
        );
        stream.end(fileBuffer);
    });

    let before;
    try {
        before = await Delivery.findOneAndUpdate(
            { orderId, riderId, isOpen: true, status: 'pickedup' },
            { $set: { photoUrl: result.secure_url, photoPublicId: result.public_id } },
            { new: false }
        )
            .select('photoPublicId')
            .lean();
    } catch (error) {
        await deleteUploadedPhoto(result.public_id);
        throw error;
    }

    if (!before) {
        await deleteUploadedPhoto(result.public_id);
        return null;
    }
    if (before.photoPublicId) {
        await deleteUploadedPhoto(before.photoPublicId);
    }
    return { photoUrl: result.secure_url };
};

const markDelivered = async (orderId, riderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const delivery = await Delivery.findOneAndUpdate(
            { orderId, riderId, isOpen: true, status: 'pickedup', photoUrl: { $gt: '' } },
            { $set: { status: 'delivered', isOpen: false, deliveredAt: new Date() } },
            { new: true, session }
        )
            .select('status deliveredAt')
            .lean();

        const order = delivery
            ? await Order.findOneAndUpdate(
                {
                    _id: orderId,
                    assignedRiderId: riderId,
                    isDeleted: false,
                    customerMealStatus: 'outfordelivery',
                },
                { $set: { customerMealStatus: 'delivered', 'statusTimestamps.deliveredAt': new Date() } },
                { new: true, session }
            )
                .select('orderNumber customerMealStatus statusTimestamps')
                .lean()
            : null;

        if (!delivery || !order) {
            await session.abortTransaction();
            return null;
        }

        await Rider.updateOne({ _id: riderId }, { $inc: { totalDeliveries: 1 } }, { session });
        await session.commitTransaction();
        return { ...order, deliveryStatus: delivery.status };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

export {
    assignRider,
    releaseRider,
    getMyActiveOrder,
    acceptOrder,
    markPickedUp,
    uploadDeliveryPhoto,
    markDelivered,
};