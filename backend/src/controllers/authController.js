import * as authService from '../services/authService.js';
import { AUTH_COOKIE, cookieOptions } from '../utils/authCookie.js';

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);

        if (result.codeRequired) {
            return res.status(200).json({
                success: true,
                message: 'Email not verified. A new code was sent.',
                data: { codeRequired: true },
            });
        }

        res.cookie(AUTH_COOKIE, result.session.token, { ...cookieOptions, maxAge: result.session.maxAgeMs });
        return res.status(200).json({ success: true, data: { user: result.session.user } });
    } catch (error) {
        return next(error);
    }
};

const register = async (req, res, next) => {
    try {
        await authService.register(req.body);
        return res.status(201).json({
            success: true,
            message: 'If the details are valid, a verification code was sent to your email',
        });
    } catch (error) {
        return next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const result = await authService.verifyEmail(req.body);

        if (result.pending) {
            return res.status(200).json({
                success: true,
                message: 'Email verified. Your registration is waiting for admin approval',
                data: { pending: true },
            });
        }

        res.cookie(AUTH_COOKIE, result.session.token, { ...cookieOptions, maxAge: result.session.maxAgeMs });
        return res.status(200).json({ success: true, data: { user: result.session.user } });
    } catch (error) {
        return next(error);
    }
};

const resendCode = async (req, res, next) => {
    try {
        await authService.resendCode(req.body);
        return res.status(200).json({
            success: true,
            message: 'If the account exists, a new code was sent to your email',
        });
    } catch (error) {
        return next(error);
    }
};

const logout = async (_req, res, next) => {
    try {
        await authService.logout();
        res.clearCookie(AUTH_COOKIE, cookieOptions);
        return res.status(200).json({ success: true, message: 'Logged out' });
    } catch (error) {
        return next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user);
        return res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        return next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        await authService.changePassword(req.user._id, req.body);
        res.clearCookie(AUTH_COOKIE, cookieOptions);
        return res.status(200).json({ success: true, message: 'Password changed. Please log in again' });
    } catch (error) {
        return next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body);
        return res.status(200).json({
            success: true,
            message: 'If the account exists, a reset code was sent to your email',
        });
    } catch (error) {
        return next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        await authService.resetPassword(req.body);
        return res.status(200).json({ success: true, message: 'Password reset. Please log in' });
    } catch (error) {
        return next(error);
    }
};

export { login, register, verifyEmail, resendCode, logout, getMe, changePassword, forgotPassword, resetPassword };