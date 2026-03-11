import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload base64 image
export async function uploadImage(base64Data, folder = 'digiboi') {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

// Delete image
export async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
}

// Get optimized URL
export function getOptimizedUrl(url, width = 400) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}
