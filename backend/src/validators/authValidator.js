import Joi from 'joi';

const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().max(120).required(),
    password: Joi.string().min(8).max(72).required(),
});

export { loginSchema };