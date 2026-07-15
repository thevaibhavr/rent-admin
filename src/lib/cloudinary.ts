import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadedImage {
  url: string;
  public_id: string;
}

export async function uploadImage(file: string, folder = 'clothing-rental'): Promise<UploadedImage> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
      transformation: [{ width: 800, height: 800, crop: 'limit' }, { quality: 'auto' }],
    });
    return { url: result.secure_url, public_id: result.public_id };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Image upload failed');
  }
}

export async function deleteImage(public_id: string) {
  try {
    return await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Image deletion failed');
  }
}

export async function uploadMultipleImages(files: string[], folder = 'clothing-rental') {
  try {
    return await Promise.all(files.map((file) => uploadImage(file, folder)));
  } catch (error) {
    console.error('Multiple images upload error:', error);
    throw new Error('Multiple images upload failed');
  }
}

export { cloudinary };
