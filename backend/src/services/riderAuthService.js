import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import * as riderAuthRepository from '../repositories/riderAuthRepository.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const login = async ({ phone, password }) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const rider = await riderAuthRepository.login(cleanPhone);
    const passwordMatches = await bcrypt.compare(password, rider?.passwordHash || DUMMY_HASH);
    if (!rider || !rider.isActive || !rider.passwordHash || !passwordMatches) {
        throw new AppError('Invalid phone or password', 401);
    }
    const token = jwt.sign(
        { sub: String(rider._id), ver: rider.tokenVersion || 0 },
        process.env.RIDER_JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '12h' }
    );
    return { token, rider: { id: rider._id, name: rider.name, phone: rider.phone } };
};

const verifyToken = async (token) => {
    let payload;
    try {
        payload = jwt.verify(token, process.env.RIDER_JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        throw new AppError('Rider login required', 401);
    }
    const rider = await riderAuthRepository.verifyToken(payload.sub);
    if (!rider || (rider.tokenVersion || 0) !== payload.ver) {
        throw new AppError('Rider login required', 401);
    }
    const { tokenVersion: _tokenVersion, ...safeRider } = rider;
    return safeRider;
};

const logout = async (riderId) => {
    await riderAuthRepository.logout(riderId);
};

const setPassword = async (riderId, password) => {
    const passwordHash = await bcrypt.hash(password, 12);
    const rider = await riderAuthRepository.setPassword(riderId, passwordHash);
    if (!rider) throw new AppError('Rider not found', 404);
};

const updateRiderLocation = async (riderId, payload) => {
    const rider = await riderAuthRepository.updateRiderLocation(riderId, payload);
    if (!rider) throw new AppError('Rider not found', 404);
    return rider;
};

export { login, verifyToken, logout, setPassword, updateRiderLocation };
