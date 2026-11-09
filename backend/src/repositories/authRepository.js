import { User } from '../models/schemas/userSchema.js';

const PROFILE = 'name email phone roles status rejectionReason mustChangePassword tokenVersion';

const findForLogin = (identifier) =>
    User.findOne(identifier.includes('@') ? { email: identifier } : { phone: identifier })
        .select(`${PROFILE} failedLoginAttempts lockedUntil +passwordHash`)
        .lean();

const findById = (id) => User.findById(id).select(PROFILE).lean();

const findByIdWithPassword = (id) => User.findById(id).select(`${PROFILE} +passwordHash`).lean();

const createUser = async (data) => {
    const user = await User.create(data);
    return user.toObject();
};

const deleteUser = (id) => User.deleteOne({ _id: id });

// +1 failure in one atomic step; at the limit, lock and reset the counter
const recordFailedLogin = (id, max, lockUntil) =>
    User.updateOne(
        { _id: id },
        [
            { $set: { failedLoginAttempts: { $add: [{ $ifNull: ['$failedLoginAttempts', 0] }, 1] } } },
            {
                $set: {
                    lockedUntil: { $cond: [{ $gte: ['$failedLoginAttempts', max] }, lockUntil, '$lockedUntil'] },
                    failedLoginAttempts: { $cond: [{ $gte: ['$failedLoginAttempts', max] }, 0, '$failedLoginAttempts'] },
                },
            },
        ],
        { updatePipeline: true }
    );

const clearFailedLogins = (id) =>
    User.updateOne({ _id: id }, { $set: { failedLoginAttempts: 0, lockedUntil: null } });

// New password: logs out every device, clears lock and pending code
const setPassword = (id, passwordHash) =>
    User.updateOne(
        { _id: id },
        {
            $set: { passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null },
            $unset: { codeHash: 1, codeExpires: 1 },
            $inc: { tokenVersion: 1 },
        }
    );

const setStatus = (id, status, rejectionReason = '') =>
    User.updateOne({ _id: id }, { $set: { status, rejectionReason }, $inc: { tokenVersion: 1 } });

const updateProfile = (id, updates) => {
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

// Saves a code on the account that matches the filter
const saveCode = (filter, codeHash, codeExpires) =>
    User.updateOne(filter, { $set: { codeHash, codeExpires, codeAttempts: 0 } });

// Atomic: right code, not expired, under 5 attempts. Removes the code so it works once.
const consumeCode = async (email, codeHash) => {
    const user = await User.findOneAndUpdate(
        { email, codeHash, codeExpires: { $gt: new Date() }, codeAttempts: { $lt: 5 } },
        { $unset: { codeHash: 1, codeExpires: 1 } }
    )
        .select('_id')
        .lean();
    if (!user) await User.updateOne({ email, codeHash: { $exists: true } }, { $inc: { codeAttempts: 1 } });
    return user;
};

// A second signup for an unverified email replaces name/password, so nobody can squat an address.
// A verified email makes the upsert fail with a duplicate key error (code 11000).
const upsertUnverifiedUser = ({ name, email, phone, passwordHash, role }) =>
    User.findOneAndUpdate(
        { email, status: 'unverified', roles: role },
        { $set: { name, passwordHash, roles: [role], ...(phone && { phone }) } },
        { upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

export {
    findForLogin,
    findById,
    findByIdWithPassword,
    createUser,
    deleteUser,
    recordFailedLogin,
    clearFailedLogins,
    setPassword,
    setStatus,
    updateProfile,
    saveCode,
    consumeCode,
    upsertUnverifiedUser,
};