import * as riderAuthService from '../services/riderAuthService.js';

const login = async (req, res, next) => {
    try {
        const { token, rider } = await riderAuthService.login(req.body);
        res.cookie('riderToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api',
            maxAge: 12 * 60 * 60 * 1000,
        });
        return res.status(200).json({ success: true, message: 'Login successful', data: rider });
    } catch (error) {
        return next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        await riderAuthService.logout(req.rider._id);
        res.clearCookie('riderToken', {
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

const getMe = (req, res) => res.status(200).json({ success: true, data: req.rider });

const updateMyLocation = async (req, res, next) => {
    try {
        await riderAuthService.updateRiderLocation(String(req.rider._id), req.body);
        return res.status(200).json({ success: true, message: 'Location updated' });
    } catch (error) {
        return next(error);
    }
};

const setRiderPassword = async (req, res, next) => {
    try {
        await riderAuthService.setPassword(req.params.riderId, req.body.password);
        return res.status(200).json({ success: true, message: 'Rider password set' });
    } catch (error) {
        return next(error);
    }
};

export { login, logout, getMe, updateMyLocation, setRiderPassword };
