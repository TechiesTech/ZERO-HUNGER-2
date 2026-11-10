import Joi from 'joi';

const kitchenDetailsSchema = Joi.object({
    address: Joi.string().trim().max(200).required(),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
});

const getAllKitchensSchema = Joi.object({
    search: Joi.string().trim().max(80),
    isActive: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});

export { kitchenDetailsSchema, getAllKitchensSchema };