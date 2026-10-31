import Joi from 'joi';

const createOrderSchema = Joi.object({
    customerName: Joi.string().trim().min(2).max(80).required(),
    customerEmail: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    customerPhone: Joi.string()
        .trim()
        .pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/)
        .allow('')
        .messages({ 'string.pattern.base': 'customerPhone must be a valid Indian mobile number' }),
    deliveryAddress: Joi.object({
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
    }).required(),
    deliveryLocation: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }),
    paymentMethod: Joi.string().trim().lowercase().valid('upi', 'card', 'netbanking').required(), items: Joi.array()
        .items(
            Joi.object({
                mealId: Joi.string().trim().lowercase().hex().length(24).required(),
                quantity: Joi.number().integer().min(1).max(20).required(),
            })
        )
        .min(1)
        .max(20)
        .required(),
});

const trackOrderSchema = Joi.object({
    orderNumber: Joi.string().trim().uppercase().min(8).max(20).required(),
    customerEmail: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
});
const trackMyOrdersSchema = Joi.object({
    orders: Joi.array()
        .items(
            Joi.object({
                orderNumber: Joi.string().trim().uppercase().min(8).max(20).required(),
                customerEmail: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
            })
        )
        .min(1)
        .max(20)
        .required(),
});
const cancelOrderSchema = Joi.object({
    orderNumber: Joi.string().trim().uppercase().min(8).max(20).required(),
    customerEmail: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
});
const getAllOrdersSchema = Joi.object({
    customerMealStatus: Joi.string()
        .trim()
        .lowercase()
        .valid('confirmed', 'preparing', 'outfordelivery', 'delivered', 'cancelled'),
    paymentStatus: Joi.string().trim().lowercase().valid('pending', 'success', 'failed'),
    search: Joi.string().trim().max(80),
    from: Joi.date().iso(),
    to: Joi.date().iso().min(Joi.ref('from')),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});
const orderIdParamSchema = Joi.object({
    orderId: Joi.string().trim().lowercase().hex().length(24).required(),
});
const updateOrderStatusSchema = Joi.object({
    customerMealStatus: Joi.string()
        .trim()
        .lowercase()
        .valid('confirmed', 'preparing', 'outfordelivery', 'delivered')
        .required(),
    assignedRiderId: Joi.string()
        .trim()
        .lowercase()
        .hex()
        .length(24)
        .when('customerMealStatus', {
            is: 'outfordelivery',
            then: Joi.required(),
            otherwise: Joi.forbidden(),
        }),
});
const updateDeliveryDetailsSchema = Joi.object({
    orderNumber: Joi.string().trim().uppercase().min(8).max(20).required(),
    customerEmail: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    customerPhone: Joi.string()
        .trim()
        .pattern(/^(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/)
        .allow('')
        .messages({ 'string.pattern.base': 'customerPhone must be a valid Indian mobile number' }),
    deliveryAddress: Joi.object({
        addressLine1: Joi.string().trim().min(3).max(120).required(),
        addressLine2: Joi.string().trim().max(120).allow('').default(''),
        area: Joi.string().trim().min(2).max(80).required(),
        landmark: Joi.string().trim().max(80).allow('').default(''),
        city: Joi.string().trim().min(2).max(60).required(),
        state: Joi.string().trim().min(2).max(60).required(),
        pincode: Joi.string()
            .trim()
            .pattern(/^[1-9][0-9]{5}$/)
            .required()
            .messages({ 'string.pattern.base': 'pincode must be a valid 6-digit Indian pincode' }),
    }),
    deliveryLocation: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }),
}).or('customerPhone', 'deliveryAddress', 'deliveryLocation');

export {
    createOrderSchema,
    trackOrderSchema,
    trackMyOrdersSchema,
    cancelOrderSchema,
    getAllOrdersSchema,
    orderIdParamSchema,
    updateOrderStatusSchema,
    updateDeliveryDetailsSchema,
};