import bcrypt from 'bcryptjs';
import AppError from '../utils/appError.js';
import * as userRepository from '../repositories/userRepository.js';

const findById = async (id) => {
    const user = await userRepository.findById(id);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

const createUser = async ({ name, email, phone, password, roles }) => {
    const passwordHash = await bcrypt.hash(password, 12);

    try {
        const user = await userRepository.createUser({
            name,
            email: email ? String(email).trim().toLowerCase() : undefined,
            phone: phone ? String(phone).replace(/\D/g, '').slice(-10) : undefined,
            passwordHash,
            roles,
            status: 'active',
            mustChangePassword: true,
        });

        const { passwordHash: _removed, ...safeUser } = user;
        return safeUser;
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('Email or phone is already in use', 409);
        }
        throw error;
    }
};

const deleteUser = async (id) => {
    const result = await userRepository.deleteUser(id);
    if (!result.deletedCount) {
        throw new AppError('User not found', 404);
    }
};

const setStatus = async (id, { status, rejectionReason }) => {
    const statuses = ['active', 'pending', 'rejected', 'disabled'];

    if (!statuses.includes(status)) {
        throw new AppError(`Status must be one of: ${statuses.join(', ')}`, 400);
    }

    if (status === 'rejected' && !rejectionReason) {
        throw new AppError('A rejection reason is required', 400);
    }

    const result = await userRepository.setStatus(id, status, status === 'rejected' ? rejectionReason : '');
    if (!result.matchedCount) {
        throw new AppError('User not found', 404);
    }

    return findById(id);
};

const setPassword = async (id, { newPassword }) => {
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const result = await userRepository.setPassword(id, passwordHash);
    if (!result.matchedCount) {
        throw new AppError('User not found', 404);
    }
};

const updateProfile = async (id, { name, email, phone }) => {
    const updates = {
        name,
        email: typeof email === 'string' ? email.trim().toLowerCase() : email,
        phone: typeof phone === 'string' && phone !== '' ? phone.replace(/\D/g, '').slice(-10) : phone,
    };

    try {
        await userRepository.updateProfile(id, updates);
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('Email or phone is already in use', 409);
        }
        throw error;
    }

    return findById(id);
};

export { findById, createUser, deleteUser, setStatus, setPassword, updateProfile };