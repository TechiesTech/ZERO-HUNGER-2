// Login for admin and kitchen only. Riders have their own login (riderAuth).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import * as authRepository from '../repositories/authRepository.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const ROLES = ['admin', 'kitchen'];

const login = async ({ email, password, role = 'admin' }) => {
    if (!ROLES.includes(role)) throw new AppError('Invalid role', 400);

    const user = await authRepository.login(role, email);
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !user.isActive || !passwordMatches) {
        throw new AppError('Invalid email or password', 401);
    }
    const token = jwt.sign(
        { sub: String(user._id), ver: user.tokenVersion || 0, role },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '2h' }
    );
    return { token, admin: { id: user._id, name: user.name, email: user.email, role } };
};

const verifyToken = async (token) => {
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        throw new AppError('Login required', 401);
    }
    const role = payload.role || 'admin'; // old admin tokens have no role
    const user = ROLES.includes(role) ? await authRepository.verifyToken(role, payload.sub) : null;
    if (!user || (user.tokenVersion || 0) !== payload.ver) {
        throw new AppError('Login required', 401);
    }
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        kitchenId: role === 'kitchen' ? user._id : null,
    };
};

const logout = async (userId, role = 'admin') => {
    await authRepository.logout(role, userId);
};

export { login, verifyToken, logout };