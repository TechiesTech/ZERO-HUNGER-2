import * as mealService from '../services/mealService.js';

const createMeal = async (req, res, next) => {
    try {
        const meal = await mealService.createMeal(req.body);

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
        const meal = await mealService.updateMeal(req.params.mealId, req.body);

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
        const query = req.validatedQuery || req.query || {};
        const { meals, pagination } = await mealService.getAllMeals(query);

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
export { createMeal, updateMeal, getAllMeals };