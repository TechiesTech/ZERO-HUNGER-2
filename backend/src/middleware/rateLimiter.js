import rateLimit from 'express-rate-limit';
import AppError from '../utils/appError.js';

const createLimiter = (max, options = {}) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, _res, next) =>
            next(new AppError('Too many requests, please try again later', 429)),
        ...options,
    });

const createOrderLimiter = createLimiter(10);
const trackOrderLimiter = createLimiter(30);
const trackLiveOrderLimiter = createLimiter(150);
const trackMyOrdersLimiter = createLimiter(20);
const updateOrderLimiter = createLimiter(10);
const adminLoginLimiter = createLimiter(10, { skipSuccessfulRequests: true });

export {
    createOrderLimiter,
    trackOrderLimiter,
    trackLiveOrderLimiter,
    trackMyOrdersLimiter,
    updateOrderLimiter,
    adminLoginLimiter
};