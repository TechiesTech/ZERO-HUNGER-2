import Joi from 'joi';

const createOrderSchema = Joi.object({
    // The customer picks one of the saved addresses
    addressId: Joi.string().trim().lowercase().hex().length(24).required(),
    paymentMethod: Joi.string().trim().lowercase().valid('upi', 'card', 'netbanking').required(),
    items: Joi.array()
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

const getMyOrdersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
});

const orderNumberParamSchema = Joi.object({
    orderNumber: Joi.string().trim().uppercase().min(8).max(20).required(),
});

// The only change allowed on an order: deliver it to another saved address
const updateDeliveryDetailsSchema = Joi.object({
    addressId: Joi.string().trim().lowercase().hex().length(24).required(),
});

const getAllOrdersSchema = Joi.object({
    customerMealStatus: Joi.string()
        .trim()
        .lowercase()
        .valid('confirmed', 'preparing', 'readyforpickup', 'outfordelivery', 'delivered', 'cancelled'),
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

const reverseGeocodeSchema = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
});

export {
    createOrderSchema,
    getMyOrdersSchema,
    orderNumberParamSchema,
    updateDeliveryDetailsSchema,
    getAllOrdersSchema,
    orderIdParamSchema,
    reverseGeocodeSchema,
};