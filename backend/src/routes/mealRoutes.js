import { Router } from 'express';
import uploadImage from '../middleware/uploadImage.js';
import { createMeal, updateMeal, getAllMeals, uploadMealImage, deleteMeal } from '../controllers/mealController.js';
import validate from '../middleware/validate.js';
import requireRole from '../middleware/requireRole.js';
import {
    createMealSchema, mealIdParamSchema, updateMealSchema, getMealsQuerySchema
} from '../validators/mealValidator.js';

const router = Router();

// Public: Customers and Admin can browse meals
router.get('/getAllMeals', validate(getMealsQuerySchema, 'query'), getAllMeals);

// Admin-only operations
router.post('/createMeal', requireRole('admin'), validate(createMealSchema), createMeal);
router.patch('/updateMealById/:mealId', requireRole('admin'), validate(mealIdParamSchema, 'params'), validate(updateMealSchema), updateMeal);
router.post('/upload-image', requireRole('admin'), uploadImage, uploadMealImage);
router.delete('/deleteMeal/:mealId', requireRole('admin'), validate(mealIdParamSchema, 'params'), deleteMeal);

export default router;