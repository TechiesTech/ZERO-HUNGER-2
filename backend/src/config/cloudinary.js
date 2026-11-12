import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const uploadImage = (buffer) =>
    new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder: 'delivery-photos', resource_type: 'image' }, (error, result) => {
                if (error) return reject(error);
                return resolve(result.public_id);
            })
            .end(buffer);
    });

const deleteImage = (photoKey) => cloudinary.uploader.destroy(photoKey);

const getPhotoUrl = (photoKey) => (photoKey ? cloudinary.url(photoKey, { secure: true }) : null);

export { uploadImage, deleteImage, getPhotoUrl };
export default cloudinary;