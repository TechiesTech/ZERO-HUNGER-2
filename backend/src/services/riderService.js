import AppError from '../utils/appError.js';
import * as riderRepository from '../repositories/riderRepository.js';
import { Delivery } from '../models/schemas/deliverySchema.js';
import bcrypt from 'bcryptjs';

const createRider = async (body) => {
    const { name, vehicleType, deliveryZones, joiningDate } = body;
    const phone = body.phone.replace(/\D/g, '').slice(-10);
    const email = body.email || '';
    const vehicleNumber = (body.vehicleNumber || '').replace(/[\s-]/g, '');

    const data = { name, phone, email, vehicleType, vehicleNumber };
    if (deliveryZones) data.deliveryZones = deliveryZones;
    if (joiningDate) data.joiningDate = joiningDate;

    try {
        const { rider, isDuplicate } = await riderRepository.createRider(data);
        if (isDuplicate) {
            const field =
                rider.phone === phone ? 'phone number' : email && rider.email === email ? 'email' : 'vehicle number';
            throw new AppError(`A rider with this ${field} already exists`, 409);
        }
        return rider;
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('A rider with the same phone, email or vehicle number already exists', 409);
        }
        throw error;
    }
};

const updateRider = async (riderId, body) => {
    const updates = { ...body }; // safe: Joi rejects unknown fields
    if (updates.phone) updates.phone = updates.phone.replace(/\D/g, '').slice(-10);
    if (updates.vehicleNumber) updates.vehicleNumber = updates.vehicleNumber.replace(/[\s-]/g, '');
    if (updates.isActive === false) updates.isAvailable = false;
    try {
        const rider = await riderRepository.updateRiderById(riderId, updates);
        if (!rider) throw new AppError('Rider not found', 404);
        return rider;
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('Another rider already has this phone, email or vehicle number', 409);
        }
        throw error;
    }
};

const getAllRiders = async (query) => {
    const { riders, total } = await riderRepository.getAllRiders(query);
    const activeDeliveryRiderIds = await Delivery.distinct('riderId', {
        isOpen: true,
        riderId: { $in: riders.map(({ _id }) => _id) },
    });
    const busyRiderIds = new Set(activeDeliveryRiderIds.map(String));
    return {
        riders: riders.map((rider) => ({ ...rider, isBusy: busyRiderIds.has(String(rider._id)) })),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
};

const getRiderById = async (riderId) => {
    const rider = await riderRepository.getRiderById(riderId);
    if (!rider) throw new AppError('Rider not found', 404);
    return rider;
};

const deleteRider = async (riderId) => {
    const rider = await riderRepository.deleteRider(riderId);
    if (!rider) throw new AppError('Rider not found', 404);
};
const registerRider = async (body) => {
    const { name, vehicleType, deliveryZones, password } = body;
    const phone = body.phone.replace(/\D/g, '').slice(-10);
    const email = body.email || '';
    const vehicleNumber = (body.vehicleNumber || '').replace(/[\s-]/g, '');

    const data = {
        name,
        phone,
        email,
        vehicleType,
        vehicleNumber,
        passwordHash: await bcrypt.hash(password, 12),
        approvalStatus: 'pending',
        isAvailable: false,
    };
    if (deliveryZones) data.deliveryZones = deliveryZones;

    try {
        const { rider, isDuplicate } = await riderRepository.createRider(data);
        if (isDuplicate) {
            throw new AppError('A rider with this phone, email or vehicle number is already registered', 409);
        }
        return { id: rider._id, name: rider.name, phone: rider.phone, approvalStatus: rider.approvalStatus };
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('A rider with this phone, email or vehicle number is already registered', 409);
        }
        throw error;
    }
};

const approveRider = async (riderId) => {
    const rider = await riderRepository.approveRider(riderId);
    if (!rider) throw new AppError('Rider not found or already approved', 404);
    return rider;
};

const rejectRider = async (riderId, reason) => {
    if (await Delivery.exists({ riderId, isOpen: true })) {
        throw new AppError('Rider has an open delivery. Release it first', 409);
    }
    const rider = await riderRepository.rejectRider(riderId, reason);
    if (!rider) throw new AppError('Rider not found or already rejected', 404);
    return rider;
};
export {
    createRider,
    updateRider,
    getAllRiders,
    getRiderById,
    deleteRider,
    registerRider,
    approveRider,
    rejectRider,
};