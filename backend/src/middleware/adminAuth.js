import AppError from '../utils/appError.js';
import * as adminService from '../services/adminService.js';

const adminAuth = async (req, _res, next) => {
    try {
        const token = req.cookies?.adminToken;
        if (!token) throw new AppError('Admin login required', 401);

        req.admin = await adminService.verifyToken(token);
        return next();
    } catch (error) {
        return next(error);
    }
};

export default adminAuth;