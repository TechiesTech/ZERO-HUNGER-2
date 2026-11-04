import * as authService from '../services/authService.js';

const login = async (req, res, next) => {
    try {
        const { token, admin } = await authService.login(req.body);
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api',
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
        res.clearCookie('adminToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api',
        });
        return res.status(200).json({ success: true, message: 'Logged out' });
    } catch (error) {
        return next(error);
    }
};

const getMe = (req, res) => res.status(200).json({ success: true, data: req.admin });

export { login, logout, getMe };