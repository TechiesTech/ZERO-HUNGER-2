import * as authService from '../services/authService.js';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
};

const login = async (req, res, next) => {
    try {
        const { token, admin } = await authService.login(req.body);
        const cookieName = admin.role === 'kitchen' ? 'kitchenToken' : 'adminToken';
        const otherCookieName = admin.role === 'kitchen' ? 'adminToken' : 'kitchenToken';
        res.clearCookie(otherCookieName, cookieOptions);
        res.cookie(cookieName, token, {
            ...cookieOptions,
            maxAge: 2 * 60 * 60 * 1000,
        });
        return res.status(200).json({ success: true, message: 'Login successful', data: { admin } });
    } catch (error) {
        return next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        await authService.logout(req.admin._id, req.admin.role);
        res.clearCookie('adminToken', cookieOptions);
        res.clearCookie('kitchenToken', cookieOptions);
        return res.status(200).json({ success: true, message: 'Logged out' });
    } catch (error) {
        return next(error);
    }
};

const getMe = (req, res) => res.status(200).json({ success: true, data: req.admin });

export { login, logout, getMe };