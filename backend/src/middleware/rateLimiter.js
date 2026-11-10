import rateLimit from 'express-rate-limit';
import AppError from '../utils/appError.js';

const createLimiter = (max, options = {}) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, _res, next) => next(new AppError('Too many requests, please try again later', 429)),
        ...options,
    });

const createOrderLimiter = createLimiter(10);
const reverseGeocodeLimiter = createLimiter(30);
const trackOrderLimiter = createLimiter(30);
const trackLiveOrderLimiter = createLimiter(150);
const trackMyOrdersLimiter = createLimiter(20);
const updateOrderLimiter = createLimiter(10);

// These read the validated body, so run them AFTER validate()
const loginIpLimiter = createLimiter(30, { skipSuccessfulRequests: true });
const loginAccountLimiter = createLimiter(10, {
    skipSuccessfulRequests: true,
    keyGenerator: (req) => req.body.identifier,
});
const registerLimiter = createLimiter(10, { windowMs: 60 * 60 * 1000 });
const codeIpLimiter = createLimiter(20);
const codeEmailLimiter = createLimiter(1, { windowMs: 60 * 1000, keyGenerator: (req) => req.body.email });
const verifyCodeLimiter = createLimiter(30);
const changePasswordLimiter = createLimiter(5, { keyGenerator: (req) => String(req.user._id) });

const riderLocationLimiter = createLimiter(12, { windowMs: 60 * 1000 });
const riderRegisterLimiter = createLimiter(5, { windowMs: 60 * 60 * 1000 });

export {
    createOrderLimiter, reverseGeocodeLimiter, trackOrderLimiter, trackLiveOrderLimiter,
    trackMyOrdersLimiter, updateOrderLimiter, loginIpLimiter, loginAccountLimiter, registerLimiter,
    codeIpLimiter, codeEmailLimiter, verifyCodeLimiter, changePasswordLimiter,
    riderLocationLimiter, riderRegisterLimiter,
};