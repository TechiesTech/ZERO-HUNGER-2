import { Admin } from '../models/schemas/adminSchema.js';

const login = async (email) =>
    Admin.findOne({ email }).select('+passwordHash').lean();

const verifyToken = async (adminId) =>
    Admin.findOne({ _id: adminId, isActive: true }).select('name email tokenVersion').lean();

const logout = async (adminId) =>
    Admin.updateOne({ _id: adminId }, { $inc: { tokenVersion: 1 } });

export { login, verifyToken, logout };