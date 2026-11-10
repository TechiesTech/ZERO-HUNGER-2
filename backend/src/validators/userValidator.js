import Joi from 'joi';

const createUserSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(120).required(),
    phone: Joi.string().trim().pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/).messages({
        'string.pattern.base': 'phone must be a valid Indian mobile number',
    }),
    password: Joi.string().min(8).max(72).required(),
    // rider is left out on purpose: riders need their own profile
    roles: Joi.array().items(Joi.string().valid('admin', 'kitchen')).min(1).unique().required(),
});

export { createUserSchema };