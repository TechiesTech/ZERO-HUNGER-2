import * as mealService from '../services/mealService.js';

const kitchenIdFor = (user) => (user.roles.includes('admin') ? null : user._id);

const createMeal = async (req, res, next) => {
    try {
        const meal = await mealService.createMeal(req.body, req.user._id);
        res.status(201).json({
            success: true,
            message: 'Meal created',
            data: meal,
        });
    } catch (error) {
        next(error);
    }
};

const updateMeal = async (req, res, next) => {
    try {
        const meal = await mealService.updateMeal(req.params.mealId, req.body, kitchenIdFor(req.user));

        res.status(200).json({
            success: true,
            message: 'Meal updated',
            data: meal,
        });
    } catch (error) {
        next(error);
    }
};

const getAllMeals = async (req, res, next) => {
    try {
        const { meals, pagination } = await mealService.getAllMeals(req.validatedQuery);
        res.status(200).json({
            success: true,
            count: meals.length,
            pagination,
            data: meals,
        });
    } catch (error) {
        next(error);
    }
};
const uploadMealImage = async (req, res, next) => {
    try {
        const image = await mealService.uploadMealImage(req.file);

        res.status(201).json({
            success: true,
            message: 'Image uploaded',
            data: image,
        });
    } catch (error) {
        next(error);
    }
};
const deleteMeal = async (req, res, next) => {
    try {
        await mealService.deleteMeal(req.params.mealId, kitchenIdFor(req.user));

        res.status(200).json({
            success: true,
            message: 'Meal deleted',
        });
    } catch (error) {
        next(error);
    }
};
export { createMeal, updateMeal, getAllMeals, uploadMealImage, deleteMeal };
