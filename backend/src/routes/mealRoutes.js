import { Router } from 'express';
import uploadImage from '../middleware/uploadImage.js';
import { createMeal, updateMeal, getAllMeals, uploadMealImage, deleteMeal } from '../controllers/mealController.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';
import requireKitchenProfile from '../middleware/requireKitchenProfile.js';

import {
    createMealSchema, mealIdParamSchema, updateMealSchema, getMealsQuerySchema
} from '../validators/mealValidator.js';

const router = Router();

// Public: customers, admins and kitchens can browse meals (filter by kitchenId)
router.get('/getAllMeals', validate(getMealsQuerySchema, 'query'), getAllMeals);

// Kitchen creates its own meals
router.post('/createMeal', authenticate, requireRoles('kitchen'), requireKitchenProfile, validate(createMealSchema), createMeal);

// Kitchen manages its own meals, admin can manage any meal
router.patch('/updateMealById/:mealId', authenticate, requireRoles('admin', 'kitchen'), validate(mealIdParamSchema, 'params'), validate(updateMealSchema), updateMeal);
router.post('/upload-image', authenticate, requireRoles('admin', 'kitchen'), uploadImage, uploadMealImage);
router.delete('/deleteMeal/:mealId', authenticate, requireRoles('admin', 'kitchen'), validate(mealIdParamSchema, 'params'), deleteMeal);

export default router;