import multer from 'multer';
import AppError from '../utils/appError.js';

const maxImageSizeInBytes = 5 * 1024 * 1024;
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxImageSizeInBytes, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (!allowedImageTypes.includes(file.mimetype)) {
            return callback(new AppError('Please upload a JPG, PNG or WebP image', 400));
        }
        return callback(null, true);
    },
});

const uploadImage = (req, res, next) => {
    upload.single('file')(req, res, (error) => {
        if (!error) return next();

        if (error.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('Image must be smaller than 5 MB', 400));
        }

        return next(error);
    });
};

export default uploadImage;