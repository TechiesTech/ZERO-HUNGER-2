// Database access for admin and kitchen login. Riders have their own repository.
import { Admin } from '../models/schemas/adminSchema.js';
import { Kitchen } from '../models/schemas/kitchenSchema.js';

const models = { admin: Admin, kitchen: Kitchen };

const login = (role, email) =>
    models[role].findOne({ email }).select('+passwordHash').lean();

const verifyToken = (role, userId) =>
    models[role].findOne({ _id: userId, isActive: true }).select('name email tokenVersion').lean();

const logout = (role, userId) =>
    models[role].updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });

const createKitchen = async (data) => {
    const kitchen = await Kitchen.create(data);
    const { passwordHash, ...safe } = kitchen.toObject();
    return safe;
};

export { login, verifyToken, logout, createKitchen };