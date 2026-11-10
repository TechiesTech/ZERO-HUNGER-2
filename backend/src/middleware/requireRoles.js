import AppError from '../utils/appError.js';

// Use after authenticate. A user with a temporary password is blocked until it is changed.
const requireRoles = (...allowed) => (req, _res, next) => {
    if (!req.user) return next(new AppError('Login required', 401));
    if (!req.user.roles.some((r) => allowed.includes(r))) {
        return next(new AppError('You do not have permission', 403));
    }
    if (req.user.mustChangePassword) return next(new AppError('You must change your password first', 403));
    return next();
};

export default requireRoles;