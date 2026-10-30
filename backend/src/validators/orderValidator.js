import Joi from 'joi';

const createOrderSchema = Joi.object({
    customerName: Joi.string().trim().min(2).max(80).required(),
    customerEmail: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    customerPhone: Joi.string()
        .trim()
        .pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/)
        .allow('')
        .messages({ 'string.pattern.base': 'customerPhone must be a valid Indian mobile number' }),
    deliveryAddress: Joi.string().trim().min(10).max(300).required(),
    paymentMethod: Joi.string().trim().uppercase().valid('UPI', 'CARD', 'NET_BANKING').required(),
    items: Joi.array()
        .items(
            Joi.object({
                mealId: Joi.string().hex().length(24).required(),
                quantity: Joi.number().integer().min(1).max(20).required(),
            })
        )
        .min(1)
        .max(20)
        .required(),
});

export { createOrderSchema };

