import Joi from 'joi';

const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(120);
const phone = Joi.string()
    .trim()
    .pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/)
    .custom((value) => value.replace(/\D/g, '').slice(-10))
    .messages({ 'string.pattern.base': 'phone must be a valid Indian mobile number' });
// bcrypt reads only the first 72 BYTES, so reject longer passwords
const newPassword = Joi.string()
    .min(8)
    .max(72)
    .custom((v, h) => (Buffer.byteLength(v) > 72 ? h.error('string.max', { limit: 72 }) : v))
    .required();
const password = Joi.string().min(1).max(72).required(); // old passwords may be shorter than 8
const code = Joi.string().pattern(/^\d{6}$/).required();

const loginSchema = Joi.object({
    identifier: Joi.alternatives()
        .try(email, phone)
        .messages({ 'alternatives.match': 'identifier must be a valid email or Indian mobile number' }),
    // Keep clients still sending { email, password } working during the API transition.
    email: Joi.alternatives().try(email, phone),
    password,
})
    .xor('identifier', 'email')
    .custom((value) => ({ identifier: value.identifier || value.email, password: value.password }));

const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: email.required(),
    phone,
    password: newPassword,
    role: Joi.string().valid('customer').default('customer'),
});

const changePasswordSchema = Joi.object({ currentPassword: password, newPassword });
const emailSchema = Joi.object({ email: email.required() });
const verifyEmailSchema = Joi.object({ email: email.required(), code });
const resetPasswordSchema = Joi.object({ email: email.required(), code, newPassword });

export { loginSchema, registerSchema, changePasswordSchema, emailSchema, verifyEmailSchema, resetPasswordSchema };