import AppError from '../utils/appError.js';
import * as authService from '../services/authService.js';

const requireRole = (...allowed) => async (req, _res, next) => {
    try {
        const token = req.cookies?.adminToken;
        if (!token) throw new AppError('Login required', 401);

        const user = await authService.verifyToken(token);
        if (!allowed.includes(user.role)) throw new AppError('You do not have permission', 403);

        req.admin = user;
        return next();
    } catch (error) {
        return next(error);
    }
};

export default requireRole;