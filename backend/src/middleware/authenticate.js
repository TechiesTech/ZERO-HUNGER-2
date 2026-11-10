import { AUTH_COOKIE } from '../utils/authCookie.js';
import { verifyToken } from '../services/authService.js';

const authenticate = async (req, _res, next) => {
    try {
        req.user = await verifyToken(req.cookies?.[AUTH_COOKIE]);
        return next();
    } catch (error) {
        return next(error);
    }
};

export default authenticate;