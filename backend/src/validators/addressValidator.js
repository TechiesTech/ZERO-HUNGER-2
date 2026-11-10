import Joi from 'joi';

// No defaults here, so an edit never wipes a field that was not sent (the schema sets the defaults)
const addressFields = {
    label: Joi.string().trim().lowercase().valid('home', 'work', 'other'),
    customerName: Joi.string().trim().min(2).max(80),
    customerPhone: Joi.string()
        .trim()
        .pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/)
        .allow('')
        .messages({ 'string.pattern.base': 'customerPhone must be a valid Indian mobile number' }),
    addressLine1: Joi.string().trim().min(3).max(120).required(),
    addressLine2: Joi.string().trim().max(120).allow(''),
    area: Joi.string().trim().min(2).max(80).required(),
    landmark: Joi.string().trim().max(80).allow(''),
    city: Joi.string().trim().min(2).max(60).required(),
    state: Joi.string().trim().min(2).max(60).required(),
    pincode: Joi.string()
        .trim()
        .pattern(/^[1-9][0-9]{5}$/)
        .required()
        .messages({ 'string.pattern.base': 'pincode must be a valid 6-digit Indian pincode' }),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
};

const createAddressSchema = Joi.object({
    ...addressFields,
    isDefault: Joi.boolean().default(false),
});

// Every field is optional on edit, but at least one must be sent
const updateAddressSchema = Joi.object(addressFields)
    .fork(['addressLine1', 'area', 'city', 'state', 'pincode', 'location'], (field) => field.optional())
    .min(1);

const addressIdParamSchema = Joi.object({
    addressId: Joi.string().trim().lowercase().hex().length(24).required(),
});

export { createAddressSchema, updateAddressSchema, addressIdParamSchema };