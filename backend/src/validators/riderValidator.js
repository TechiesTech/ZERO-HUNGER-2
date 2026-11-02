import Joi from 'joi';

const createRiderSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    phone: Joi.string()
        .trim()
        .pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/)
        .required()
        .messages({ 'string.pattern.base': 'phone must be a valid Indian mobile number' }),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).allow(''),
    vehicleType: Joi.string().trim().lowercase().valid('bike', 'bicycle', 'scooter').required(),
    vehicleNumber: Joi.string().trim().uppercase().max(15).allow(''),
    deliveryZones: Joi.array().items(Joi.string().trim().max(60)).max(20).unique(),
    joiningDate: Joi.date().iso(),
});

const riderIdParamSchema = Joi.object({
    riderId: Joi.string().hex().length(24).required(),
});

const updateRiderLocationSchema = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    heading: Joi.number().min(0).max(360).allow(null).default(null),
});

const updateRiderSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80),
    phone: Joi.string()
        .trim()
        .pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/)
        .messages({ 'string.pattern.base': 'phone must be a valid Indian mobile number' }),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).allow(''),
    vehicleType: Joi.string().trim().lowercase().valid('bike', 'bicycle', 'scooter'),
    vehicleNumber: Joi.string().trim().uppercase().max(15).allow(''),
    deliveryZones: Joi.array().items(Joi.string().trim().max(60)).max(20).unique(),
    isAvailable: Joi.boolean(),
    isActive: Joi.boolean(),
}).min(1);
export {
    createRiderSchema,
    riderIdParamSchema,
    updateRiderLocationSchema,
    updateRiderSchema
};