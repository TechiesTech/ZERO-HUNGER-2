import AppError from '../utils/appError.js';
import { verifyToken } from '../services/authService.js';
import { AUTH_COOKIE } from '../utils/authCookie.js';

const authenticate = async (req, _res, next) => {
    try {
        const token = req.cookies?.[AUTH_COOKIE];
        if (!token) throw new AppError('Login required', 401);
        req.user = await verifyToken(token);
        return next();
    } catch (error) {
        return next(error);
    }
};

export default authenticate;