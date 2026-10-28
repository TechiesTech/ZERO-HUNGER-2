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

const getAllMeals = async ({ category, isAvailable, page = 1, limit = 10 } = {}) => {
    const filter = { isDeleted: false };
    if (category) filter.mealCategories = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [meals, totalMeals] = await Promise.all([
        Meal.find(filter)
            .sort({ displayOrder: 1, createdAt: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Meal.countDocuments(filter),
    ]);

    return { meals, totalMeals };
};
export { findActiveBySlug, findActiveById, createMeal, updateMeal, getAllMeals };