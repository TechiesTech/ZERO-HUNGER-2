import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppError from '../utils/appError.js';
import * as repo from '../repositories/authRepository.js';
import { sendCodeEmail } from './emailService.js';

const COST = 12; // bcrypt cost
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST); // compared when no account exists

// ---------- Shared helpers (used by several functions) ----------
const normalizePhone = (v) => String(v).replace(/\D/g, '').slice(-10);

const hashCode = (email, purpose, code) =>
    crypto.createHmac('sha256', process.env.CODE_SECRET).update(`${email}|${purpose}|${code}`).digest('hex');

// Safe shape for the client and req.user: no hash, no counters
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
    const hoursByRole = { admin: 2, kitchen: 2, rider: 12, donor: 720, recipient: 720 };
    const hours = Math.min(...user.roles.map((r) => hoursByRole[r] || 2));
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
// Mail is sent only when an account matched, and is not awaited,
// so the response looks the same whether or not the account exists.
const issueCode = async (filter, email, purpose) => {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const result = await repo.saveCode({ email, ...filter }, hashCode(email, purpose, code), expires);
    if (result.matchedCount) {
        sendCodeEmail({ to: email, code, purpose }).catch((e) =>
            console.error(`Failed to send ${purpose} email:`, e.message)
        );
    }
};

// ---------- Register ----------
// Donor and recipient self-register. The validator allows only these two roles.
const register = async ({ name, email, phone, password, role }) => {
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
    const passwordHash = await bcrypt.hash(password, COST);
    try {
        const user = await repo.createUser({
            name,
            email,
            phone: phone && normalizePhone(phone),
            passwordHash,
            roles: [role],
            status: 'unverified',
        });
        await issueCode({ status: 'unverified' }, email, 'signup');
        return user;
    } catch (error) {
        if (error.code === 11000) throw new AppError('Email or phone is already registered', 409);
        throw error;
    }
};

// Admin creates kitchen or rider. The caller creates the profile with _id = user._id
// and calls deleteUser(user._id) if that fails. Admin accounts come only from the seed script.
const createStaffAccount = async ({ name, email, phone, password, role }) => {
    if (!['kitchen', 'rider'].includes(role)) throw new AppError('Invalid role', 400);
    const passwordHash = await bcrypt.hash(password, COST);
    try {
        return await repo.createUser({
            name,
            email,
            phone: phone && normalizePhone(phone),
            passwordHash,
            roles: [role],
            status: 'active',
            mustChangePassword: role === 'kitchen',
        });
    } catch (error) {
        if (error.code === 11000) throw new AppError('Email or phone is already registered', 409);
        throw error;
    }
};

const verifyEmail = async ({ email, code }) => {
    const found = await repo.consumeCode(email, hashCode(email, 'signup', code));
    if (!found) throw new AppError('Invalid or expired code', 400);

    const user = await repo.findById(found._id);
    if (!user || user.status !== 'unverified') throw new AppError('Invalid or expired code', 400);

    const nextStatus = user.roles.includes('rider') ? 'pending' : 'active';
    await repo.setStatus(user._id, nextStatus);
    if (nextStatus === 'pending') return { pending: true };
    return { session: createSession({ ...user, status: 'active', tokenVersion: (user.tokenVersion || 0) + 1 }) };
};

const resendCode = ({ email }) => issueCode({ status: 'unverified' }, email, 'signup');

// ---------- Login (all roles, no role in the request) ----------
const login = async ({ identifier, password }) => {
    const maxFailed = 5;
    const lockMs = 15 * 60 * 1000; // 15 minutes

    const value = String(identifier).trim().toLowerCase();
    const user = await repo.findForLogin(value.includes('@') ? value : normalizePhone(value));
    const locked = user?.lockedUntil && user.lockedUntil > new Date();

    // A locked account gets the same 401 as a wrong password, so nothing about it leaks
    const matches = await bcrypt.compare(password, !user || locked ? DUMMY_HASH : user.passwordHash || DUMMY_HASH);

    if (!user || locked || !user.passwordHash) throw new AppError('Invalid credentials', 401);
    if (!matches) {
        await repo.recordFailedLogin(user._id, maxFailed, new Date(Date.now() + lockMs));
        throw new AppError('Invalid credentials', 401);
    }
    if (user.failedLoginAttempts) await repo.clearFailedLogins(user._id);

    // The password is right, so the real status can be shown
    if (user.status === 'unverified') {
        if (user.email) await issueCode({ status: 'unverified' }, user.email, 'signup');
        return { codeRequired: true };
    }
    if (user.status === 'pending') throw new AppError('Your registration is waiting for admin approval', 403);
    if (user.status === 'rejected') {
        throw new AppError(
            `Your registration was rejected${user.rejectionReason ? `: ${user.rejectionReason}` : ''}`,
            403
        );
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

// Logs out every device, including this one
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
    if (!found) throw new AppError('Invalid or expired code', 400);
    await repo.setPassword(found._id, await bcrypt.hash(newPassword, COST));
};

// ---------- Admin actions ----------
// Called from reviewRider after the rider profile is updated
const reviewRiderAccount = (id, approve, reason = '') =>
    repo.setStatus(id, approve ? 'active' : 'rejected', approve ? '' : reason);

const deleteUser = (id) => repo.deleteUser(id);

export {
    register,
    createPendingUser,
    createStaffAccount,
    verifyEmail,
    resendCode,
    login,
    verifyToken,
    changePassword,
    forgotPassword,
    resetPassword,
    reviewRiderAccount,
    deleteUser,
};