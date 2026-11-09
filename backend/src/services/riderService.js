import AppError from '../utils/appError.js';
import * as riderRepository from '../repositories/riderRepository.js';
import { Delivery } from '../models/schemas/deliverySchema.js';
import * as authService from './authService.js';

const createRider = async (body) => {
    const { name, vehicleType, deliveryZones, joiningDate, password } = body;
    const phone = body.phone.replace(/\D/g, '').slice(-10);
    const email = body.email?.trim().toLowerCase() || '';
    const vehicleNumber = (body.vehicleNumber || '').replace(/[\s-]/g, '');

    const data = { name, phone, email, vehicleType, vehicleNumber };
    if (deliveryZones) data.deliveryZones = deliveryZones;
    if (joiningDate) data.joiningDate = joiningDate;

    const user = await authService.createStaffAccount({
        name,
        email: email || undefined,
        phone,
        password,
        role: 'rider',
    });
    try {
        const { rider, isDuplicate } = await riderRepository.createRider({ ...data, _id: user._id });
        if (isDuplicate) {
            const field =
                rider.phone === phone ? 'phone number' : email && rider.email === email ? 'email' : 'vehicle number';
            throw new AppError(`A rider with this ${field} already exists`, 409);
        }
        return rider;
    } catch (error) {
        await authService.deleteUser(user._id);
        if (error.code === 11000) {
            throw new AppError('A rider with the same phone, email or vehicle number already exists', 409);
        }
        throw error;
    }
};

const updateRider = async (riderId, body) => {
    const existing = await riderRepository.getRiderById(riderId);
    if (!existing) throw new AppError('Rider not found', 404);

    const updates = { ...body }; // safe: Joi rejects unknown fields
    const isActive = updates.isActive;
    delete updates.isActive;
    if (updates.phone) updates.phone = updates.phone.replace(/\D/g, '').slice(-10);
    if (updates.vehicleNumber) updates.vehicleNumber = updates.vehicleNumber.replace(/[\s-]/g, '');
    if (updates.email !== undefined) updates.email = updates.email.trim().toLowerCase();
    if (isActive === false) updates.isAvailable = false;

    const identityUpdates = Object.fromEntries(
        Object.entries(updates).filter(([field]) => ['name', 'email', 'phone'].includes(field))
    );
    const previousIdentity = Object.keys(identityUpdates).length
        ? await authService.getUserProfile(riderId)
        : null;

    let updated;
    try {
        if (previousIdentity) await authService.updateUserProfile(riderId, identityUpdates);
        updated = await riderRepository.updateRiderById(riderId, updates);
        if (!updated) throw new AppError('Rider not found', 404);
    } catch (error) {
        if (previousIdentity) await authService.updateUserProfile(riderId, previousIdentity);
        if (error.code === 11000) {
            throw new AppError('Another rider already has this phone, email or vehicle number', 409);
        }
        throw error;
    }

    if (isActive !== undefined && (isActive || existing.approvalStatus === 'approved')) {
        const status = isActive && existing.approvalStatus === 'approved' ? 'active' : 'suspended';
        await authService.setAccountStatus(riderId, status);
    }
    return riderRepository.getRiderById(riderId);
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
    await authService.setAccountStatus(riderId, 'suspended');
};

const registerRider = async (body) => {
    const { name, vehicleType, deliveryZones, password } = body;
    const phone = body.phone.replace(/\D/g, '').slice(-10);
    const email = body.email.trim().toLowerCase();
    const vehicleNumber = (body.vehicleNumber || '').replace(/[\s-]/g, '');
    const user = await authService.createPendingUser({ name, email, phone, password, role: 'rider' });
    const data = { _id: user._id, name, phone, email, vehicleType, vehicleNumber, approvalStatus: 'pending', isAvailable: false };
    if (deliveryZones) data.deliveryZones = deliveryZones;

    try {
        const { rider, isDuplicate } = await riderRepository.createRider(data);
        if (isDuplicate) {
            throw new AppError('A rider with this phone, email or vehicle number is already registered', 409);
        }
        return { id: rider._id, name: rider.name, phone: rider.phone, approvalStatus: rider.approvalStatus };
    } catch (error) {
        await authService.deleteUser(user._id);
        if (error.code === 11000) {
            throw new AppError('A rider with this phone, email or vehicle number is already registered', 409);
        }
        throw error;
    }
};
const reviewRider = async (riderId, status, reason) => {
    if (status === 'rejected' && (await Delivery.exists({ riderId, isOpen: true }))) {
        throw new AppError('Rider has an open delivery. Release it first', 409);
    }
    const rider = await riderRepository.reviewRider(riderId, status, reason);
    if (!rider) throw new AppError(`Rider not found or already ${status}`, 404);
    await authService.reviewRiderAccount(riderId, status === 'approved', reason);
    return riderRepository.getRiderById(riderId);
};

const updateRiderLocation = async (riderId, location) => {
    const rider = await riderRepository.updateRiderLocation(riderId, location);
    if (!rider) throw new AppError('Rider not found', 404);
};

export {
    createRider,
    updateRider,
    getAllRiders,
    getRiderById,
    deleteRider,
    registerRider,
    reviewRider,
    updateRiderLocation,
};