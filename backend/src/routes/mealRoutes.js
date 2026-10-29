import { Router } from 'express';
import uploadImage from '../middleware/uploadImage.js';
import { createMeal, updateMeal, getAllMeals, uploadMealImage, deleteMeal } from '../controllers/mealController.js';
import validate from '../middleware/validate.js';
import {
    createMealSchema, mealIdParamSchema, updateMealSchema, getMealsQuerySchema
} from '../validators/mealValidator.js';

const router = Router();

router.post('/createMeal', validate(createMealSchema), createMeal);
router.patch('/updateMealById/:mealId', validate(mealIdParamSchema, 'params'), validate(updateMealSchema), updateMeal);
router.get('/getAllMeals', validate(getMealsQuerySchema, 'query'), getAllMeals);
router.post('/upload-image', uploadImage, uploadMealImage);
router.delete('/deleteMeal/:mealId', validate(mealIdParamSchema, 'params'), deleteMeal);

export default router;