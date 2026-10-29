import mongoose from 'mongoose';

const { Schema } = mongoose;

export const MEAL_CATEGORIES = [
  'VEG',
  'NON-VEG',
  'PROTEIN',
  'KIDS MEALS',
  'FAMILY MEALS',
];

const mealSchema = new Schema(
  {
    mealName: {
      type: String,
      required: [true, 'Meal name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    mealSlug: {
      type: String,
      required: [true, 'Meal slug is required'],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and hyphens'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    ingredientsList: {
      type: [{ type: String, trim: true, maxlength: 60 }],
      default: [],
    },
    mealCategories: {
      type: [{ type: String, trim: true, uppercase: true, enum: MEAL_CATEGORIES }],
      validate: {
        validator: (list) => Array.isArray(list) && list.length > 0,
        message: 'At least one category is required',
      },
    },
    priceInRupees: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Price must be a whole number of rupees',
      },
    },
    caloriesKcal: { type: Number, min: 0, default: 0 },
    proteinInGrams: { type: Number, min: 0, default: 0 },
    imageUrl: { type: String, trim: true, default: '' },
    imagePublicId: { type: String, trim: true, default: '' },
    isAvailable: { type: Boolean, default: true },
    unavailableReason: { type: String, trim: true, maxlength: 120, default: '' },
    displayOrder: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

mealSchema.index(
  { mealSlug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
mealSchema.index({ isDeleted: 1, mealCategories: 1, displayOrder: 1 });
mealSchema.index({ isDeleted: 1, isAvailable: 1 });
mealSchema.index({ mealName: 'text' });
mealSchema.index({ createdAt: -1 });

export const Meal = mongoose.model('Meals', mealSchema, 'meals');