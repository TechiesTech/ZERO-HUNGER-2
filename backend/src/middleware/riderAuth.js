import AppError from '../utils/appError.js';
import * as riderAuthService from '../services/riderAuthService.js';

const riderAuth = async (req, _res, next) => {
    try {
        const token = req.cookies?.riderToken;
        if (!token) throw new AppError('Rider login required', 401);
        req.rider = await riderAuthService.verifyToken(token);
        return next();
    } catch (error) {
        return next(error);
    }
};

export default riderAuth;
