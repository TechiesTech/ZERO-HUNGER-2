import bcrypt from 'bcryptjs';
import AppError from '../utils/appError.js';
import { uploadImage, deleteImage, getPhotoUrl } from '../config/cloudinary.js';
import * as riderRepository from '../repositories/riderRepository.js';
import { notifyOrderStatus, notifyOrderReady, notifyOrderTaken, notifyRiderRegistered } from '../socket.js';

// A failed delete must never hide the real error, so it is only logged
const safeDeleteImage = async (photoPublicId) => {
    if (!photoPublicId) return;
    try {
        await deleteImage(photoPublicId);
    } catch (error) {
        console.error('Could not delete delivery photo:', photoPublicId, error.message);
    }
};

const registerRider = async ({ name, email, phone, password, vehicleType, vehicleNumber }) => {
    const passwordHash = await bcrypt.hash(password, 12);

    const rider = await riderRepository
        .registerRider({ name, email, phone, passwordHash, vehicleType, vehicleNumber })
        .catch((error) => {
            if (error.code === 11000) throw new AppError('Email, phone or vehicle number is already registered', 409);
            throw error;
        });

    notifyRiderRegistered(rider); // the admin sees the pending rider at once
    return rider;
};

const setAvailability = async (user, { isAvailable }) => {
    // Going offline in the middle of a delivery would freeze the customer's tracking
    if (!isAvailable) {
        const current = await riderRepository.getRider(user._id);
        if (current && (await riderRepository.hasOpenDelivery(current._id))) {
            throw new AppError('Finish your current delivery before going offline', 409);
        }
    }
    const rider = await riderRepository.setAvailability(user._id, isAvailable);
    if (!rider) throw new AppError('Rider profile not found', 404);
    return rider;
};

const getMyProfile = async (user) => {
    const rider = await riderRepository.getRiderProfile(user._id);
    if (!rider) throw new AppError('Rider profile not found', 404);
    return rider;
};

const updateLocation = async (user, { latitude, longitude, heading }) => {
    const rider = await riderRepository.updateLocation(user._id, latitude, longitude, heading ?? null);
    if (!rider) throw new AppError('Go online to share your location', 400);
    return rider;
};

const getAvailableOrders = async () => {
    const orders = await riderRepository.getAvailableOrders();
    return { orders };
};

const acceptOrder = async (user, orderNumber) => {
    const rider = await riderRepository.getRider(user._id);
    if (!rider) throw new AppError('Rider profile not found', 404);
    if (!rider.isAvailable) throw new AppError('Go online to accept orders', 400);

    const delivery = await riderRepository.acceptOrder(rider._id, orderNumber).catch((error) => {
        if (error.code === 11000) throw new AppError('You already have a delivery in progress', 409);
        throw error;
    });
    if (!delivery) throw new AppError('Order is no longer available', 409);

    const { customerId, kitchenId, ...data } = delivery;

    notifyOrderTaken(data.orderNumber); // other riders remove it from their list
    notifyOrderStatus({
        orderNumber: data.orderNumber,
        status: 'readyforpickup',
        deliveryStatus: 'accepted',
        customerId,
        kitchenId,
    });

    return data;
};

const releaseOrder = async (user, orderNumber) => {
    const rider = await riderRepository.getRider(user._id);
    if (!rider) throw new AppError('Rider profile not found', 404);

    const released = await riderRepository.releaseOrder(rider._id, orderNumber);
    if (!released) {
        throw new AppError('Order not found, or it is already picked up and cannot be released', 404);
    }

    const { customerId, kitchenId, ...data } = released;

    notifyOrderReady(data.orderNumber); // open for other riders again
    notifyOrderStatus({
        orderNumber: data.orderNumber,
        status: 'readyforpickup',
        deliveryStatus: 'released',
        customerId,
        kitchenId,
    });

    return data;
};

const updateStatus = async (user, orderNumber, { status }, file) => {
    if (status === 'delivered' && !file) throw new AppError('Delivery photo is required', 400);

    const rider = await riderRepository.getRider(user._id);
    if (!rider) throw new AppError('Rider profile not found', 404);

    // Upload first. If the status cannot be saved, the photo is deleted again
    const photoPublicId = status === 'delivered' ? await uploadImage(file.buffer) : null;
    const photoUrl = photoPublicId ? getPhotoUrl(photoPublicId) : null;

    const order = await riderRepository
        .updateStatus(rider._id, orderNumber, status, photoPublicId, photoUrl)
        .catch(async (error) => {
            await safeDeleteImage(photoPublicId);
            throw error;
        });

    if (!order) {
        await safeDeleteImage(photoPublicId);
        throw new AppError('Order not found or not in the correct status', 404);
    }

    const { customerId, kitchenId, ...data } = order;

    notifyOrderStatus({
        orderNumber: data.orderNumber,
        status: data.customerMealStatus,
        deliveryStatus: status,
        customerId,
        kitchenId,
    });

    return photoUrl ? { ...data, photoUrl } : data;
};

const currentDelivery = async (user) => {
    return riderRepository.currentDelivery(user._id);
};

const getMyDeliveries = async (user, { month, page, limit }) => {
    const currentMonth = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const selectedMonth = month || currentMonth;
    if (selectedMonth > currentMonth) throw new AppError('Month cannot be in the future', 400);

    const [year, monthNumber] = selectedMonth.split('-').map(Number);
    const nextYear = monthNumber === 12 ? year + 1 : year;
    const nextMonthNumber = monthNumber === 12 ? 1 : monthNumber + 1;
    const from = new Date(`${selectedMonth}-01T00:00:00+05:30`);
    const to = new Date(`${nextYear}-${String(nextMonthNumber).padStart(2, '0')}-01T00:00:00+05:30`);

    const report = await riderRepository.getMyDeliveries(user._id, from, to, (page - 1) * limit, limit);
    if (!report) throw new AppError('Rider profile not found', 404);

    const totalDeliveries = report.total[0]?.count || 0;
    return {
        month: selectedMonth,
        totalDeliveries,
        deliveries: report.deliveries.map((delivery) => ({
            orderNumber: delivery.orderNumber,
            deliveredAt: delivery.deliveredAt,
            area: delivery.area,
            // New records have the link saved. Older ones are built from the public id
            photoUrl: delivery.photoUrl || getPhotoUrl(delivery.photoPublicId) || '',
        })),
        pagination: { page, limit, total: totalDeliveries, totalPages: Math.ceil(totalDeliveries / limit) },
    };
};

const getRiderStats = async () => {
    const since = new Date(Date.now() - 2 * 60 * 1000);
    const { totalRiders, pending, active, live, busy } = await riderRepository.getRiderStats(since);
    return { totalRiders, pending, active, live, busy, free: live - busy };
};

const getAllRiders = async ({ status, page, limit }) => {
    const since = new Date(Date.now() - 2 * 60 * 1000);
    const { riders, total } = await riderRepository.getAllRiders(status, since, (page - 1) * limit, limit);
    return { riders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const reviewRider = async (userId, { status, reason }) => {
    const rider = await riderRepository.reviewRider(userId, status, reason);
    if (!rider) throw new AppError('Pending rider not found', 404);
    return rider;
};

export {
    registerRider,
    getMyProfile,
    setAvailability,
    updateLocation,
    getAvailableOrders,
    acceptOrder,
    releaseOrder,
    updateStatus,
    currentDelivery,
    getMyDeliveries,
    getRiderStats,
    getAllRiders,
    reviewRider
};