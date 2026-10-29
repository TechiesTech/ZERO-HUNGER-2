import { Meal } from '../models/schemas/mealSchema.js';
import cloudinary from '../config/cloudinary.js';

const findActiveBySlug = async (mealSlug) =>
    Meal.findOne({ mealSlug, isDeleted: false }).lean();

const findActiveById = async (mealId) =>
    Meal.findOne({ _id: mealId, isDeleted: false }).lean();

const createMeal = async (mealData) => Meal.create(mealData);

const updateMeal = async (mealId, updateData) =>
    Meal.findOneAndUpdate(
        { _id: mealId, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();

const getAllMeals = async ({ category, isAvailable, page = 1, limit = 10 } = {}) => {
    const filter = { isDeleted: false };
    if (category) filter.mealCategories = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [meals, totalMeals] = await Promise.all([
        Meal.find(filter)
            .sort({ displayOrder: 1, createdAt: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Meal.countDocuments(filter),
    ]);

    return { meals, totalMeals };
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

const deleteMeal = async (mealId) => {
    const deletedMeal = await Meal.findOneAndUpdate(
        { _id: mealId, isDeleted: false },
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
export { findActiveBySlug, findActiveById, createMeal, updateMeal, getAllMeals, uploadImageToCloudinary, deleteMeal };
