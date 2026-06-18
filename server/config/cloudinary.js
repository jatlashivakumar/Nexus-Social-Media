import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Avatar: square crop 400×400 focused on face
export const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nexus/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
});

// Cover image: wide banner — do NOT crop, just limit width
export const coverImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nexus/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1500, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
});

export const postImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nexus/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
});

export const chatMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nexus/chat',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'pdf'],
  },
});

export const deleteCloudinaryAsset = async (publicId, type = 'image') => {
  try { return await cloudinary.uploader.destroy(publicId, { resource_type: type }); }
  catch { return null; }
};

export default cloudinary;

