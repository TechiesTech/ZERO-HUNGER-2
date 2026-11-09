import { User } from '../models/schemas/userSchema.js';

const login = async (identifier) => {
    const filter = identifier.includes('@') ? { email: identifier } : { phone: identifier };

    return User.findOne(filter)
        .select('name email phone roles status rejectionReason mustChangePassword tokenVersion failedLoginAttempts lockedUntil +passwordHash')
        .lean();
};

const loginFailed = async (id, maxAttempts, lockUntil) => {
    return User.updateOne({ _id: id }, [
        { $set: { failedLoginAttempts: { $add: [{ $ifNull: ['$failedLoginAttempts', 0] }, 1] } } },
        {
            $set: {
                lockedUntil: { $cond: [{ $gte: ['$failedLoginAttempts', maxAttempts] }, lockUntil, '$lockedUntil'] },
                failedLoginAttempts: { $cond: [{ $gte: ['$failedLoginAttempts', maxAttempts] }, 0, '$failedLoginAttempts'] },
            },
        },
    ]);
};

const loginSuccess = async (id) => {
    return User.updateOne({ _id: id }, { $set: { failedLoginAttempts: 0, lockedUntil: null } });
};

const register = async ({ name, email, phone, passwordHash, role, codeHash, codeExpires }) => {
    return User.updateOne(
        { email, status: 'unverified', roles: role },
        {
            $set: {
                name,
                passwordHash,
                roles: [role],
                codeHash,
                codeExpires,
                codeAttempts: 0,
                ...(phone && { phone }),
            },
        },
        { upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
};

const verifyEmail = async (email, codeHash) => {
    const valid = {
        $and: [
            { $eq: ['$codeHash', codeHash] },
            { $gt: ['$codeExpires', '$$NOW'] },
            { $lt: [{ $ifNull: ['$codeAttempts', 0] }, 5] },
        ],
    };

    const user = await User.findOneAndUpdate(
        { email, status: 'unverified', codeHash: { $exists: true } },
        [
            {
                $set: {
                    codeAttempts: { $cond: [valid, '$codeAttempts', { $add: [{ $ifNull: ['$codeAttempts', 0] }, 1] }] },
                    codeHash: { $cond: [valid, '$$REMOVE', '$codeHash'] },
                    codeExpires: { $cond: [valid, '$$REMOVE', '$codeExpires'] },
                    status: { $cond: [valid, { $cond: [{ $in: ['rider', '$roles'] }, 'pending', 'active'] }, '$status'] },
                    tokenVersion: { $cond: [valid, { $add: [{ $ifNull: ['$tokenVersion', 0] }, 1] }, '$tokenVersion'] },
                },
            },
        ],
        { new: true }
    )
        .select('name email phone roles status mustChangePassword tokenVersion +codeHash')
        .lean();

    return user && !user.codeHash ? user : null;
};

const resendCode = async (email, codeHash, codeExpires) => {
    return User.updateOne({ email, status: 'unverified' }, { $set: { codeHash, codeExpires, codeAttempts: 0 } });
};

const getUserWithPassword = async (id) => {
    return User.findById(id).select('+passwordHash').lean();
};

const changePassword = async (id, passwordHash) => {
    return User.updateOne(
        { _id: id },
        {
            $set: { passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null },
            $unset: { codeHash: 1, codeExpires: 1 },
            $inc: { tokenVersion: 1 },
        }
    );
};

const forgotPassword = async (email, codeHash, codeExpires) => {
    return User.updateOne({ email, status: 'active' }, { $set: { codeHash, codeExpires, codeAttempts: 0 } });
};

const resetPassword = async (email, codeHash, passwordHash) => {
    const valid = {
        $and: [
            { $eq: ['$codeHash', codeHash] },
            { $gt: ['$codeExpires', '$$NOW'] },
            { $lt: [{ $ifNull: ['$codeAttempts', 0] }, 5] },
        ],
    };

    const user = await User.findOneAndUpdate(
        { email, status: 'active', codeHash: { $exists: true } },
        [
            {
                $set: {
                    codeAttempts: { $cond: [valid, '$codeAttempts', { $add: [{ $ifNull: ['$codeAttempts', 0] }, 1] }] },
                    codeHash: { $cond: [valid, '$$REMOVE', '$codeHash'] },
                    codeExpires: { $cond: [valid, '$$REMOVE', '$codeExpires'] },
                    passwordHash: { $cond: [valid, passwordHash, '$passwordHash'] },
                    mustChangePassword: { $cond: [valid, false, '$mustChangePassword'] },
                    failedLoginAttempts: { $cond: [valid, 0, '$failedLoginAttempts'] },
                    lockedUntil: { $cond: [valid, null, '$lockedUntil'] },
                    tokenVersion: { $cond: [valid, { $add: [{ $ifNull: ['$tokenVersion', 0] }, 1] }, '$tokenVersion'] },
                },
            },
        ],
        { new: true }
    )
        .select('_id +codeHash')
        .lean();

    return user && !user.codeHash ? user : null;
};

export {
    login,
    loginFailed,
    loginSuccess,
    register,
    verifyEmail,
    resendCode,
    getUserWithPassword,
    changePassword,
    forgotPassword,
    resetPassword,
};