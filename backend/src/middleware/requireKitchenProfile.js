import AppError from '../utils/appError.js';
import { Kitchen } from '../models/schemas/kitchenSchema.js';

const requireKitchenProfile = async (req, _res, next) => {
    try {
        const exists = await Kitchen.exists({ _id: req.user._id });
        if (!exists) return next(new AppError('Add your kitchen address and location first', 403));
        return next();
    } catch (error) {
        return next(error);
    }
};

export default requireKitchenProfile;