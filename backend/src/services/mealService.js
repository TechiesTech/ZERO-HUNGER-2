import * as mealRepository from '../repositories/mealRepository.js';
import AppError from '../utils/appError.js';

const createMeal = async (payload, kitchenId) => {
    const mealSlug =
        payload.mealSlug ||
        payload.mealName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

    if (!mealSlug) {
        throw new AppError('Could not create a slug from the meal name', 400);
    }

    try {
        return await mealRepository.createMeal({
            ...payload,
            kitchenId,
            mealSlug,
            unavailableReason: payload.isAvailable ? '' : payload.unavailableReason,
        });
    } catch (error) {
        if (error.code === 11000) throw new AppError('This kitchen already has a meal with this slug', 409);
        throw error;
    }
};

// kitchenId is null for admin (any meal), or the kitchen's own id (own meals only)
const updateMeal = async (mealId, payload, kitchenId) => {
    const updateData = { ...payload };
    if (payload.isAvailable === true) updateData.unavailableReason = '';

    try {
        const updatedMeal = await mealRepository.updateMeal(mealId, kitchenId, updateData);
        if (!updatedMeal) throw new AppError('Meal not found', 404);
        return updatedMeal;
    } catch (error) {
        if (error.code === 11000) throw new AppError('This kitchen already has a meal with this slug', 409);
        throw error;
    }
};

const getAllMeals = async ({ kitchenId, category, isAvailable, page, limit }) => {
    const { meals, totalMeals } = await mealRepository.getAllMeals({ kitchenId, category, isAvailable, page, limit });

    return {
        meals,
        pagination: { page, limit, totalMeals, totalPages: Math.ceil(totalMeals / limit) },
    };
};

const uploadFolder = 'zerohunger/meals';
const uploadMealImage = async (file) => {
    if (!file) {
        throw new AppError('Please choose a photo to upload', 400);
    }

    const result = await mealRepository.uploadImageToCloudinary(file.buffer, uploadFolder);

    return {
        imageUrl: result.secure_url,
        imagePublicId: result.public_id,
    };
};

const deleteMeal = async (mealId, kitchenId) => {
    const deletedMeal = await mealRepository.deleteMeal(mealId, kitchenId);

    if (!deletedMeal) {
        throw new AppError('Meal not found', 404);
    }

    return deletedMeal;
};

export { createMeal, updateMeal, getAllMeals, uploadMealImage, deleteMeal };