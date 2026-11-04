import Joi from 'joi';

const createKitchenSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email().max(120).required(),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required(),
    address: Joi.string().trim().max(200).allow(''),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }),
    password: Joi.string().min(8).max(72).required(),
});

export { createKitchenSchema };