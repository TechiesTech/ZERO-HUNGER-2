import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import * as authRepository from '../repositories/authRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import { sendCodeEmail } from './emailService.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const login = async ({ identifier, password }) => {
    const value = String(identifier).trim().toLowerCase();
    const lookup = value.includes('@') ? value : value.replace(/\D/g, '').slice(-10);

    const user = await authRepository.login(lookup);
    const locked = Boolean(user && user.lockedUntil && user.lockedUntil > new Date());

    const hashToCompare = user && !locked && user.passwordHash ? user.passwordHash : DUMMY_HASH;
    const matches = await bcrypt.compare(password, hashToCompare);

    if (!user || locked || !user.passwordHash) {
        throw new AppError('Invalid credentials', 401);
    }

    if (!matches) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await authRepository.loginFailed(user._id, 5, lockUntil);
        throw new AppError('Invalid credentials', 401);
    }

    if (user.failedLoginAttempts) {
        await authRepository.loginSuccess(user._id);
    }

    if (user.status === 'unverified') {
        if (user.email) {
            const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
            const codeHash = crypto
                .createHmac('sha256', process.env.CODE_SECRET)
                .update(`${user.email}|signup|${code}`)
                .digest('hex');
            const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

            const saved = await authRepository.resendCode(user.email, codeHash, codeExpires);
            if (saved.matchedCount) {
                sendCodeEmail({ to: user.email, code, purpose: 'signup' }).catch((error) => {
                    console.error('Signup email failed:', error.message);
                });
            }
        }
        return { codeRequired: true };
    }

    if (user.status === 'pending') {
        throw new AppError('Your registration is waiting for admin approval', 403);
    }

    if (user.status === 'rejected') {
        const reason = user.rejectionReason ? `: ${user.rejectionReason}` : '';
        throw new AppError(`Your registration was rejected${reason}`, 403);
    }

    if (user.status !== 'active') {
        throw new AppError('Account is disabled', 403);
    }

    const hoursByRole = { admin: 2, kitchen: 2, rider: 12, customer: 720 };
    const hours = user.roles.length ? Math.min(...user.roles.map((role) => hoursByRole[role] || 2)) : 2;

    const token = jwt.sign({ sub: String(user._id), ver: user.tokenVersion || 0 }, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: `${hours}h`,
    });

    return {
        session: {
            token,
            maxAgeMs: hours * 60 * 60 * 1000,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email || null,
                phone: user.phone || null,
                roles: user.roles,
                status: user.status,
                mustChangePassword: Boolean(user.mustChangePassword),
            },
        },
    };
};

const register = async ({ name, email, phone, password, role }) => {
    const passwordHash = await bcrypt.hash(password, 12);
    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : undefined;

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = crypto
        .createHmac('sha256', process.env.CODE_SECRET)
        .update(`${email}|signup|${code}`)
        .digest('hex');
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

    try {
        await authRepository.register({ name, email, phone: cleanPhone, passwordHash, role, codeHash, codeExpires });
    } catch (error) {
        if (error.code === 11000) return;
        throw error;
    }

    sendCodeEmail({ to: email, code, purpose: 'signup' }).catch((error) => {
        console.error('Signup email failed:', error.message);
    });
};

const verifyEmail = async ({ email, code }) => {
    const codeHash = crypto
        .createHmac('sha256', process.env.CODE_SECRET)
        .update(`${email}|signup|${code}`)
        .digest('hex');

    const user = await authRepository.verifyEmail(email, codeHash);
    if (!user) {
        throw new AppError('Invalid or expired code', 400);
    }

    if (user.status === 'pending') {
        return { pending: true };
    }

    const hoursByRole = { admin: 2, kitchen: 2, rider: 12, customer: 720 };
    const hours = user.roles.length ? Math.min(...user.roles.map((role) => hoursByRole[role] || 2)) : 2;

    const token = jwt.sign({ sub: String(user._id), ver: user.tokenVersion || 0 }, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: `${hours}h`,
    });

    return {
        session: {
            token,
            maxAgeMs: hours * 60 * 60 * 1000,
            user: {
                _id: user._id,
                id: String(user._id),
                name: user.name,
                email: user.email || null,
                phone: user.phone || null,
                roles: user.roles,
                status: user.status,
                mustChangePassword: Boolean(user.mustChangePassword),
            },
        },
    };
};

const resendCode = async ({ email }) => {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = crypto
        .createHmac('sha256', process.env.CODE_SECRET)
        .update(`${email}|signup|${code}`)
        .digest('hex');
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const saved = await authRepository.resendCode(email, codeHash, codeExpires);
    if (saved.matchedCount) {
        sendCodeEmail({ to: email, code, purpose: 'signup' }).catch((error) => {
            console.error('Signup email failed:', error.message);
        });
    }
};

const logout = async () => ({ loggedOut: true });

const getMe = async (user) => user;

const changePassword = async (id, { currentPassword, newPassword }) => {
    const user = await authRepository.getUserWithPassword(id);

    const hashToCompare = user && user.passwordHash ? user.passwordHash : DUMMY_HASH;
    const matches = await bcrypt.compare(currentPassword, hashToCompare);

    if (!user || !matches) {
        throw new AppError('Current password is incorrect', 401);
    }

    if (currentPassword === newPassword) {
        throw new AppError('New password must be different', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await authRepository.changePassword(id, newHash);
};

const forgotPassword = async ({ email }) => {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = crypto
        .createHmac('sha256', process.env.CODE_SECRET)
        .update(`${email}|resetPassword|${code}`)
        .digest('hex');
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const saved = await authRepository.forgotPassword(email, codeHash, codeExpires);
    if (saved.matchedCount) {
        sendCodeEmail({ to: email, code, purpose: 'resetPassword' }).catch((error) => {
            console.error('Reset email failed:', error.message);
        });
    }
};

const resetPassword = async ({ email, code, newPassword }) => {
    const codeHash = crypto
        .createHmac('sha256', process.env.CODE_SECRET)
        .update(`${email}|resetPassword|${code}`)
        .digest('hex');
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const user = await authRepository.resetPassword(email, codeHash, passwordHash);
    if (!user) {
        throw new AppError('Invalid or expired code', 400);
    }
};

const verifyToken = async (token) => {
    if (!token) {
        throw new AppError('Not authenticated', 401);
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (error) {
        throw new AppError('Not authenticated', 401);
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || user.status !== 'active' || (user.tokenVersion || 0) !== payload.ver) {
        throw new AppError('Not authenticated', 401);
    }

    return user;
};

export {
    login,
    register,
    verifyEmail,
    resendCode,
    logout,
    getMe,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyToken,
};