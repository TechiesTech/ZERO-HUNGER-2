import Joi from 'joi';

const setAvailabilitySchema = Joi.object({
    isAvailable: Joi.boolean().required(),
});

const updateLocationSchema = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    heading: Joi.number().min(0).max(360),
});

const updateStatusSchema = Joi.object({
    status: Joi.string().trim().lowercase().valid('pickedup', 'delivered').required(),
});

const getMyDeliveriesSchema = Joi.object({
    month: Joi.string()
        .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
        .messages({ 'string.pattern.base': 'month must be in YYYY-MM format' }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
});

const getAllRidersSchema = Joi.object({
    status: Joi.string().trim().lowercase().valid('pending', 'active', 'live', 'busy', 'free'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
});

const orderNumberParamSchema = Joi.object({
    orderNumber: Joi.string().trim().uppercase().min(8).max(20).required(),
});

const userIdParamSchema = Joi.object({
    userId: Joi.string().trim().lowercase().hex().length(24).required(),
});

const reviewRiderSchema = Joi.object({
    status: Joi.string().trim().lowercase().valid('active', 'rejected').required(),
    reason: Joi.string().trim().min(3).max(200).when('status', {
        is: 'rejected',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
    }),
});

const registerRiderSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email().required(),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required()
        .messages({ 'string.pattern.base': 'phone must be a valid 10 digit Indian number' }),
    password: Joi.string().min(8).max(64).required(),
    vehicleType: Joi.string().trim().lowercase().valid('bike', 'scooty').required(),
    vehicleNumber: Joi.string().trim().uppercase().min(4).max(15).required(),
});

export {
    setAvailabilitySchema,
    updateLocationSchema,
    updateStatusSchema,
    getMyDeliveriesSchema,
    getAllRidersSchema,
    orderNumberParamSchema,
    userIdParamSchema,
    reviewRiderSchema,
    registerRiderSchema
};