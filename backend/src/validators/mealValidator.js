import Joi from 'joi';
import { MEAL_CATEGORIES } from '../models/schemas/mealSchema.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

const createMealSchema = Joi.object({
    mealName: Joi.string().trim().min(2).max(80).required(),
    mealSlug: Joi.string().trim().lowercase().pattern(slugPattern),
    description: Joi.string().trim().max(300).allow('').default(''),
    ingredientsList: Joi.array().items(Joi.string().trim().max(60)).default([]),
    mealCategories: Joi.array()
        .items(Joi.string().trim().uppercase().valid(...MEAL_CATEGORIES))
        .min(1)
        .unique()
        .required(),
    priceInRupees: Joi.number().integer().min(1).required(),
    caloriesKcal: Joi.number().min(0).default(0),
    proteinInGrams: Joi.number().min(0).default(0),
    imageUrl: Joi.string().trim().uri({ scheme: ['https'] }).allow('').default(''),
    isAvailable: Joi.boolean().default(true),
    unavailableReason: Joi.string().trim().max(120).allow('').default(''),
    displayOrder: Joi.number().integer().default(0),
});

const updateMealSchema = Joi.object({
    mealName: Joi.string().trim().min(2).max(80),
    mealSlug: Joi.string().trim().lowercase().pattern(slugPattern),
    description: Joi.string().trim().max(300).allow(''),
    ingredientsList: Joi.array().items(Joi.string().trim().max(60)),
    mealCategories: Joi.array()
        .items(Joi.string().trim().uppercase().valid(...MEAL_CATEGORIES))
        .min(1)
        .unique(),
    priceInRupees: Joi.number().integer().min(1),
    caloriesKcal: Joi.number().min(0),
    proteinInGrams: Joi.number().min(0),
    imageUrl: Joi.string().trim().uri({ scheme: ['https'] }).allow(''),
    isAvailable: Joi.boolean(),
    unavailableReason: Joi.string().trim().max(120).allow(''),
    displayOrder: Joi.number().integer(),
}).min(1);

const mealIdParamSchema = Joi.object({
    mealId: Joi.string().pattern(mongoIdPattern).required().messages({
        'string.pattern.base': 'mealId must be a valid id',
    }),
});

const getMealsQuerySchema = Joi.object({
    category: Joi.string().trim().uppercase().valid(...MEAL_CATEGORIES),
    isAvailable: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

export { createMealSchema, updateMealSchema, mealIdParamSchema, getMealsQuerySchema };