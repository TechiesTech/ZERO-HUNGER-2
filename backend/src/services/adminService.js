import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import * as adminRepository from '../repositories/adminRepository.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const login = async ({ email, password }) => {
    const admin = await adminRepository.login(email);
    const passwordMatches = await bcrypt.compare(password, admin?.passwordHash || DUMMY_HASH);
    if (!admin || !admin.isActive || !passwordMatches) {
        throw new AppError('Invalid email or password', 401);
    }
    const token = jwt.sign(
        { sub: String(admin._id), ver: admin.tokenVersion || 0 },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '2h' }
    );
    return { token, admin: { id: admin._id, name: admin.name, email: admin.email } };
};

const verifyToken = async (token) => {
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        throw new AppError('Admin login required', 401);
    }
    const admin = await adminRepository.verifyToken(payload.sub);
    if (!admin || (admin.tokenVersion || 0) !== payload.ver) {
        throw new AppError('Admin login required', 401);
    }
    return { _id: admin._id, name: admin.name, email: admin.email };
};

const logout = async (adminId) => {
    await adminRepository.logout(adminId);
};

export { login, verifyToken, logout };