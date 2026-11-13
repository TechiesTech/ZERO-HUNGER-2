import Joi from 'joi';

const kitchenDetailsSchema = Joi.object({
    address: Joi.object({
        addressLine1: Joi.string().trim().max(200).required(),
        area: Joi.string().trim().max(100).required(),
        landmark: Joi.string().trim().max(100).allow(''),
        city: Joi.string().trim().max(80).required(),
        state: Joi.string().trim().max(80).required(),
        pincode: Joi.string().trim().pattern(/^\d{6}$/).required(),
    }).required(),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
    serviceRadiusKm: Joi.number().min(0.5).max(50),
    isOpen: Joi.boolean(),
});

const getAllKitchensSchema = Joi.object({
    search: Joi.string().trim().max(80),
    isActive: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});

export { kitchenDetailsSchema, getAllKitchensSchema };