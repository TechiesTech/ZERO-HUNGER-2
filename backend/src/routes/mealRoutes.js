import { Router } from 'express';
import { createMeal, updateMeal } from '../controllers/mealController.js';
import validate from '../middleware/validate.js';
import {
    createMealSchema, mealIdParamSchema, updateMealSchema
} from '../validators/mealValidator.js';

const router = Router();

router.post('/createMeal', validate(createMealSchema), createMeal);

router.patch('/updateMealById/:mealId', validate(mealIdParamSchema, 'params'), validate(updateMealSchema), updateMeal);

export default router;