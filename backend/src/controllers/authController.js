import * as authService from '../services/authService.js';
import { AUTH_COOKIE, cookieOptions } from '../utils/authCookie.js';

const wrap = (handler) => (req, res, next) => handler(req, res).catch(next);

const sendSession = (res, session) => {
    res.cookie(AUTH_COOKIE, session.token, { ...cookieOptions, maxAge: session.maxAgeMs });
    return res.status(200).json({ success: true, message: 'Login successful', data: { user: session.user } });
};

const login = wrap(async (req, res) => {
    const { session, codeRequired } = await authService.login(req.body);
    if (codeRequired) {
        return res.status(200).json({
            success: true,
            message: 'Please verify your email. A code was sent',
            data: { codeRequired: true },
        });
    }
    return sendSession(res, session);
});

const verifyEmail = wrap(async (req, res) => {
    const { session, pending } = await authService.verifyEmail(req.body);
    if (pending) {
        return res.status(200).json({
            success: true,
            message: 'Email verified. Your registration is waiting for admin approval',
        });
    }
    return sendSession(res, session);
});

const register = wrap(async (req, res) => {
    await authService.register(req.body);
    return res.status(201).json({ success: true, message: 'If the email is valid, we sent a code to it' });
});

const resendCode = wrap(async (req, res) => {
    await authService.resendCode(req.body);
    return res.status(200).json({ success: true, message: 'If the account needs verification, a code was sent' });
});

// Clears only this browser's cookie. Other devices stay logged in.
const logout = (_req, res) => {
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    return res.status(200).json({ success: true, message: 'Logged out' });
};

const getMe = (req, res) => res.status(200).json({ success: true, data: { user: req.user } });

const changePassword = wrap(async (req, res) => {
    await authService.changePassword(req.user._id, req.body);
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    return res.status(200).json({ success: true, message: 'Password changed. Please log in again' });
});

const forgotPassword = wrap(async (req, res) => {
    await authService.forgotPassword(req.body);
    return res.status(200).json({ success: true, message: 'If the account exists, a code was sent' });
});

const resetPassword = wrap(async (req, res) => {
    await authService.resetPassword(req.body);
    return res.status(200).json({ success: true, message: 'Password updated. Please log in' });
});

export { login, register, verifyEmail, resendCode, logout, getMe, changePassword, forgotPassword, resetPassword };