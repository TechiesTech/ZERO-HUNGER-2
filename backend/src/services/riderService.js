import bcrypt from 'bcryptjs';
import AppError from '../utils/appError.js';
import { uploadImage, deleteImage, getPhotoUrl } from '../config/cloudinary.js';
import * as riderRepository from '../repositories/riderRepository.js';

const registerRider = async ({ name, email, phone, password, vehicleType, vehicleNumber }) => {
    const passwordHash = await bcrypt.hash(password, 12);

    return riderRepository
        .registerRider({ name, email, phone, passwordHash, vehicleType, vehicleNumber })
        .catch((error) => {
            if (error.code === 11000) throw new AppError('Email, phone or vehicle number is already registered', 409);
            throw error;
        });
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

    return delivery;
};

const updateStatus = async (user, orderNumber, { status }, file) => {
    if (status === 'delivered' && !file) throw new AppError('Delivery photo is required', 400);

    const rider = await riderRepository.getRider(user._id);
    if (!rider) throw new AppError('Rider profile not found', 404);

    const photoKey = status === 'delivered' ? await uploadImage(file.buffer) : null;
    const order = await riderRepository.updateStatus(rider._id, orderNumber, status, photoKey);

    if (!order) {
        if (photoKey) await deleteImage(photoKey);
        throw new AppError('Order not found or not in the correct status', 404);
    }

    return photoKey ? { ...order, photoUrl: getPhotoUrl(photoKey) } : order;
};

const currentDelivery = async (user) => {
    const delivery = await riderRepository.currentDelivery(user._id);
    if (!delivery) throw new AppError('No delivery in progress', 404);
    return delivery;
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
            photoUrl: getPhotoUrl(delivery.photoKey),
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
    setAvailability,
    updateLocation,
    getAvailableOrders,
    acceptOrder,
    updateStatus,
    currentDelivery,
    getMyDeliveries,
    getRiderStats,
    getAllRiders,
    reviewRider
};