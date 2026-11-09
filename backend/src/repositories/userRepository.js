import { User } from '../models/schemas/userSchema.js';

const findById = async (id) => {
    return User.findById(id)
        .select('name email phone roles status rejectionReason mustChangePassword tokenVersion')
        .lean();
};

const createUser = async (data) => {
    const user = await User.create(data);
    return user.toObject();
};

const deleteUser = async (id) => {
    return User.deleteOne({ _id: id });
};

const setStatus = async (id, status, rejectionReason = '') => {
    return User.updateOne({ _id: id }, { $set: { status, rejectionReason }, $inc: { tokenVersion: 1 } });
};

const setPassword = async (id, passwordHash) => {
    return User.updateOne(
        { _id: id },
        {
            $set: { passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null },
            $unset: { codeHash: 1, codeExpires: 1 },
            $inc: { tokenVersion: 1 },
        }
    );
};

const updateProfile = async (id, updates) => {
    const $set = {};
    const $unset = {};

    for (const field of ['name', 'email', 'phone']) {
        if (updates[field] === undefined) continue;
        if (updates[field] === '') $unset[field] = 1;
        else $set[field] = updates[field];
    }

    return User.updateOne(
        { _id: id },
        {
            ...(Object.keys($set).length && { $set }),
            ...(Object.keys($unset).length && { $unset }),
        }
    );
};

export { findById, createUser, deleteUser, setStatus, setPassword, updateProfile };