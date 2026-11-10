import AppError from '../utils/appError.js';

const authorize = (...allowedRoles) => {
    return async (req, _res, next) => {
        const allowed = req.user && req.user.roles.some((role) => allowedRoles.includes(role));
        if (!allowed) {
            return next(new AppError('You do not have permission to do this', 403));
        }
        return next();
    };
};

export default authorize;