import AppError from '../utils/appError.js';
import * as riderRepository from '../repositories/riderRepository.js';

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
    return {
        riders,
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
export {
    createRider,
    updateRider,
    getAllRiders,
    getRiderById,
    deleteRider,
};