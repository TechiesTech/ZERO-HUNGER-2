import { Router } from 'express';
import uploadImage from '../middleware/uploadImage.js';
import { createMeal, updateMeal, getAllMeals, getImageUploadSignature, uploadMealImage } from '../controllers/mealController.js';
import validate from '../middleware/validate.js';
import {
    createMealSchema, mealIdParamSchema, updateMealSchema, getMealsQuerySchema
} from '../validators/mealValidator.js';

const router = Router();

router.post('/createMeal', validate(createMealSchema), createMeal);
router.patch('/updateMealById/:mealId', validate(mealIdParamSchema, 'params'), validate(updateMealSchema), updateMeal);
router.get('/getAllMeals', validate(getMealsQuerySchema, 'query'), getAllMeals);
router.get('/image-upload-signature', getImageUploadSignature);
router.post('/upload-image', uploadImage, uploadMealImage);
export default router;