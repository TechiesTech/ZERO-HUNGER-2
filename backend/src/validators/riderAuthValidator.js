import Joi from 'joi';

const riderLoginSchema = Joi.object({
    phone: Joi.string()
        .trim()
        .pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/)
        .required()
        .messages({ 'string.pattern.base': 'phone must be a valid Indian mobile number' }),
    password: Joi.string().min(8).max(72).required(),
});

const setRiderPasswordSchema = Joi.object({
    password: Joi.string().min(8).max(72).required(),
});

export { riderLoginSchema, setRiderPasswordSchema };
