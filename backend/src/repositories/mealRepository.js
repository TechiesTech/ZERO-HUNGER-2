import mongoose from 'mongoose';
import { Meal } from '../models/schemas/mealSchema.js';
import cloudinary from '../config/cloudinary.js';

const createMeal = async (mealData) => Meal.create(mealData);

const updateMeal = async (mealId, kitchenId, updateData) =>
    Meal.findOneAndUpdate(
        { _id: mealId, isDeleted: false, ...(kitchenId && { kitchenId }) },
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();

const getAllMeals = async ({ kitchenId, category, isAvailable, page, limit }) => {
    const filter = { isDeleted: false };
    if (kitchenId) filter.kitchenId = new mongoose.Types.ObjectId(kitchenId);
    if (category) filter.mealCategories = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;

    const [result] = await Meal.aggregate([
        { $match: filter },
        { $sort: { displayOrder: 1, createdAt: 1 } },
        {
            $facet: {
                meals: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    return { meals: result.meals, totalMeals: result.total[0]?.count || 0 };
};

const uploadImageToCloudinary = async (fileBuffer, folder) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                asset_folder: folder,
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                resource_type: 'image',
            },
            (error, result) => (error ? reject(error) : resolve(result))
        );

        stream.end(fileBuffer);
    });

const deleteMeal = async (mealId, kitchenId) => {
    const deletedMeal = await Meal.findOneAndUpdate(
        { _id: mealId, isDeleted: false, ...(kitchenId && { kitchenId }) },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: false }
    ).lean();

    if (!deletedMeal) return null;

    const { imagePublicId } = deletedMeal;

    if (imagePublicId) {
        const otherMealUsesImage = await Meal.exists({
            imagePublicId,
            _id: { $ne: mealId },
            isDeleted: false,
        });

        if (!otherMealUsesImage) {
            try {
                await cloudinary.uploader.destroy(imagePublicId, {
                    resource_type: 'image',
                    invalidate: true,
                });
            } catch (error) {
                console.error('Could not delete image from Cloudinary:', error.message);
            }
        }
    }

    return deletedMeal;
};

export { createMeal, updateMeal, getAllMeals, uploadImageToCloudinary, deleteMeal };