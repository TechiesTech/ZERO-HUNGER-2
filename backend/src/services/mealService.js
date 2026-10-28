import * as mealRepository from '../repositories/mealRepository.js';
import AppError from '../utils/appError.js';

const createSlug = (text) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const createMeal = async (payload) => {
    const mealSlug = payload.mealSlug || createSlug(payload.mealName);

    if (!mealSlug) {
        throw new AppError('Could not create a slug from the meal name', 400);
    }

    const existingMeal = await mealRepository.findActiveBySlug(mealSlug);
    if (existingMeal) {
        throw new AppError('A meal with this slug already exists', 409);
    }

    const mealData = {
        ...payload,
        mealSlug,
        unavailableReason: payload.isAvailable ? '' : payload.unavailableReason,
    };

    return mealRepository.createMeal(mealData);
};

const updateMeal = async (mealId, payload) => {
    const existingMeal = await mealRepository.findActiveById(mealId);
    if (!existingMeal) {
        throw new AppError('Meal not found', 404);
    }

    if (payload.mealSlug && payload.mealSlug !== existingMeal.mealSlug) {
        const slugOwner = await mealRepository.findActiveBySlug(payload.mealSlug);
        if (slugOwner) {
            throw new AppError('A meal with this slug already exists', 409);
        }
    }

    const updateData = { ...payload };

    if (payload.isAvailable === true) {
        updateData.unavailableReason = '';
    }

    const updatedMeal = await mealRepository.updateMeal(mealId, updateData);
    if (!updatedMeal) {
        throw new AppError('Meal not found', 404);
    }

    return updatedMeal;
};

const getAllMeals = async (query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);

    const { meals, totalMeals } = await mealRepository.getAllMeals({
        ...query,
        page,
        limit,
    });

    return {
        meals,
        pagination: {
            page,
            limit,
            totalMeals,
            totalPages: Math.ceil(totalMeals / limit),
        },
    };
};

export { createMeal, updateMeal, getAllMeals };
