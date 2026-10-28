import { Meal } from '../models/schemas/mealSchema.js';

const findActiveBySlug = async (mealSlug) =>
    Meal.findOne({ mealSlug, isDeleted: false }).lean();

const findActiveById = async (mealId) =>
    Meal.findOne({ _id: mealId, isDeleted: false }).lean();

const createMeal = async (mealData) => Meal.create(mealData);

const updateMeal = async (mealId, updateData) =>
    Meal.findOneAndUpdate(
        { _id: mealId, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();

const mealRepository = {
    findActiveBySlug,
    findActiveById,
    createMeal,
    updateMeal,
};

export { findActiveBySlug, findActiveById, createMeal, updateMeal };
export default mealRepository;