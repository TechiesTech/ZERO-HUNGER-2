import { Router } from 'express';
import uploadImage from '../middleware/uploadImage.js';
import { createMeal, updateMeal, getAllMeals, uploadMealImage, deleteMeal } from '../controllers/mealController.js';
import validate from '../middleware/validate.js';
import requireRole from '../middleware/requireRole.js';
import {
    createMealSchema, mealIdParamSchema, updateMealSchema, getMealsQuerySchema
} from '../validators/mealValidator.js';

const router = Router();

// Public: donors, admin and kitchens can browse meals (filter by kitchenId)
router.get('/getAllMeals', validate(getMealsQuerySchema, 'query'), getAllMeals);

// Kitchen creates its own meals
router.post('/createMeal', requireRole('kitchen'), validate(createMealSchema), createMeal);

// Kitchen manages its own meals, admin can manage any meal
router.patch('/updateMealById/:mealId', requireRole('admin', 'kitchen'), validate(mealIdParamSchema, 'params'), validate(updateMealSchema), updateMeal);
router.post('/upload-image', requireRole('admin', 'kitchen'), uploadImage, uploadMealImage);
router.delete('/deleteMeal/:mealId', requireRole('admin', 'kitchen'), validate(mealIdParamSchema, 'params'), deleteMeal);

export default router;