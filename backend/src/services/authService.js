import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppError from '../utils/appError.js';
import * as repo from '../repositories/authRepository.js';
import { sendCodeEmail } from './emailService.js';

const COST = 12;
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST);
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_HOURS = { admin: 2, kitchen: 2, rider: 12, customer: 720 };
const PUBLIC_ROLES = ['customer'];
const STAFF_ROLES = ['kitchen', 'rider'];

const invalidCode = () => new AppError('Invalid or expired code', 400);
const normalizePhone = (v) => String(v).replace(/\D/g, '').slice(-10);
const normalizeIdentifier = (v) => {
    const value = String(v).trim().toLowerCase();
    return value.includes('@') ? value : normalizePhone(value);
};
const hashCode = (email, purpose, code) =>
    crypto.createHmac('sha256', process.env.CODE_SECRET).update(`${email}|${purpose}|${code}`).digest('hex');

// Safe shape for client and req.user: no hash, no counters
const toUser = (u) => ({
    _id: u._id,
    id: String(u._id),
    name: u.name,
    email: u.email || null,
    phone: u.phone || null,
    roles: u.roles,
    status: u.status,
    mustChangePassword: Boolean(u.mustChangePassword),
});

const createSession = (user) => {
    const hours = Math.min(...user.roles.map((r) => SESSION_HOURS[r] || 2));
    return {
        token: jwt.sign({ sub: String(user._id), ver: user.tokenVersion || 0 }, process.env.JWT_SECRET, {
            algorithm: 'HS256',
            expiresIn: `${hours}h`,
        }),
        maxAgeMs: hours * 60 * 60 * 1000,
        user: toUser(user),
    };
};

// ---------- Email codes ----------
// Mail is only sent when an account matched, and is not awaited,
// so the response looks the same whether or not the account exists.
const issueCode = async (filter, email, purpose) => {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const result = await repo.saveCode(
        { email, ...filter },
        hashCode(email, purpose, code),
        new Date(Date.now() + CODE_TTL_MS)
    );
    if (result.matchedCount) {
        sendCodeEmail({ to: email, code, purpose }).catch((e) =>
            console.error(`Failed to send ${purpose} email:`, e.message)
        );
    }
};

// ---------- Customer registration ----------
const register = async ({ name, email, phone, password, role }) => {
    if (!PUBLIC_ROLES.includes(role)) throw new AppError('This role cannot self-register', 403);
    const passwordHash = await bcrypt.hash(password, COST);
    try {
        await repo.upsertUnverifiedUser({ name, email, phone: phone && normalizePhone(phone), passwordHash, role });
    } catch (error) {
        if (error.code === 11000) return; // already registered: same reply, so emails cannot be probed
        throw error;
    }
    await issueCode({ status: 'unverified' }, email, 'signup');
};

// Rider self-signup: the rider service calls this, then creates the Rider profile with the SAME _id
const createPendingUser = async ({ name, email, phone, password, role }) => {
    if (role !== 'rider') throw new AppError('Invalid role', 400);
    const passwordHash = await bcrypt.hash(password, COST);
    let user;
    try {
        user = await repo.createUser({
            name, email, phone: phone && normalizePhone(phone), passwordHash, roles: [role], status: 'unverified',
        });
        await issueCode({ status: 'unverified' }, email, 'signup');
        return user;
    } catch (error) {
        if (user) await repo.deleteUser(user._id);
        if (error.code === 11000) throw new AppError('Email or phone is already registered', 409);
        throw error;
    }
};

// Admin creates kitchen or rider. Caller creates the profile with _id = user._id,
// and calls deleteUser(user._id) if that fails.
const createStaffAccount = async ({ name, email, phone, password, role }) => {
    if (!STAFF_ROLES.includes(role)) throw new AppError('Invalid role', 400);
    const passwordHash = await bcrypt.hash(password, COST);
    try {
        return await repo.createUser({
            name, email, phone: phone && normalizePhone(phone), passwordHash,
            roles: [role], status: 'active', mustChangePassword: true,
        });
    } catch (error) {
        if (error.code === 11000) throw new AppError('Email or phone is already registered', 409);
        throw error;
    }
};

const verifyEmail = async ({ email, code }) => {
    const found = await repo.consumeCode(email, hashCode(email, 'signup', code));
    if (!found) throw invalidCode();
    const user = await repo.findById(found._id);
    if (!user || user.status !== 'unverified') throw invalidCode();

    const nextStatus = user.roles.includes('rider') ? 'pending' : 'active';
    await repo.setStatus(user._id, nextStatus);
    if (nextStatus === 'pending') return { pending: true };
    return { session: createSession({ ...user, status: 'active', tokenVersion: (user.tokenVersion || 0) + 1 }) };
};

const resendCode = ({ email }) => issueCode({ status: 'unverified' }, email, 'signup');

// ---------- Login (all roles, no role in the request) ----------
const login = async ({ identifier, password }) => {
    const user = await repo.findForLogin(normalizeIdentifier(identifier));
    const locked = user?.lockedUntil && user.lockedUntil > new Date();
    // When locked, the same 401 is returned as for a wrong password (no account leak)
    const matches = await bcrypt.compare(password, !user || locked ? DUMMY_HASH : user.passwordHash || DUMMY_HASH);

    if (!user || locked || !user.passwordHash) throw new AppError('Invalid credentials', 401);
    if (!matches) {
        await repo.recordFailedLogin(user._id, MAX_FAILED, new Date(Date.now() + LOCK_MS));
        throw new AppError('Invalid credentials', 401);
    }
    if (user.failedLoginAttempts) await repo.clearFailedLogins(user._id);

    // Password is right, so now the real status can be shown
    if (user.status === 'unverified') {
        if (user.email) await issueCode({ status: 'unverified' }, user.email, 'signup');
        return { codeRequired: true };
    }
    if (user.status === 'pending') throw new AppError('Your registration is waiting for admin approval', 403);
    if (user.status === 'rejected') {
        throw new AppError(`Your registration was rejected${user.rejectionReason ? `: ${user.rejectionReason}` : ''}`, 403);
    }
    if (user.status !== 'active') throw new AppError('Account is disabled', 403);

    return { session: createSession(user) };
};

// ---------- Session: roles are read from the DB on every request ----------
const verifyToken = async (token) => {
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        throw new AppError('Login required', 401);
    }
    if (!mongoose.isValidObjectId(payload.sub)) throw new AppError('Login required', 401);
    const user = await repo.findById(payload.sub);
    if (!user || user.status !== 'active' || (user.tokenVersion || 0) !== payload.ver) {
        throw new AppError('Login required', 401);
    }
    return toUser(user);
};

const changePassword = async (id, { currentPassword, newPassword }) => {
    const user = await repo.findByIdWithPassword(id);
    const matches = await bcrypt.compare(currentPassword, user?.passwordHash || DUMMY_HASH);
    if (!user || !matches) throw new AppError('Current password is incorrect', 401);
    if (currentPassword === newPassword) throw new AppError('New password must be different', 400);
    await repo.setPassword(id, await bcrypt.hash(newPassword, COST));
};

// ---------- Forgot / reset ----------
const forgotPassword = ({ email }) => issueCode({ status: 'active' }, email, 'resetPassword');

const resetPassword = async ({ email, code, newPassword }) => {
    const found = await repo.consumeCode(email, hashCode(email, 'resetPassword', code));
    if (!found) throw invalidCode();
    await repo.setPassword(found._id, await bcrypt.hash(newPassword, COST));
};

// Admin approves or rejects a rider (called from reviewRider)
const reviewRiderAccount = async (id, approve, reason = '') => {
    const user = await repo.findById(id);
    if (!user?.roles.includes('rider')) throw new AppError('Rider account not found', 404);
    return repo.setStatus(id, approve ? 'active' : 'rejected', approve ? '' : reason);
};

const setAccountStatus = async (id, status, reason = '') => {
    const result = await repo.setStatus(id, status, reason);
    if (!result.matchedCount) throw new AppError('Account not found', 404);
};

const updateUserProfile = async (id, updates) => {
    try {
        const result = await repo.updateProfile(id, updates);
        if (!result.matchedCount) throw new AppError('Account not found', 404);
    } catch (error) {
        if (error.code === 11000) throw new AppError('Email or phone is already registered', 409);
        throw error;
    }
};

const getUserProfile = async (id) => {
    const user = await repo.findById(id);
    if (!user) throw new AppError('Account not found', 404);
    return { name: user.name, email: user.email || '', phone: user.phone || '' };
};

const deleteUser = (id) => repo.deleteUser(id);

export {
    register, createPendingUser, createStaffAccount, verifyEmail, resendCode, login, verifyToken,
    changePassword, forgotPassword, resetPassword, reviewRiderAccount, setAccountStatus,
    updateUserProfile, getUserProfile, deleteUser,
};