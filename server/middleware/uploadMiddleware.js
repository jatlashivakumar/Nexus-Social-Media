import multer from 'multer';
import { avatarStorage, coverImageStorage, postImageStorage, chatMediaStorage } from '../config/cloudinary.js';
import AppError from '../utils/AppError.js';

const imgFilter = (req, file, cb) =>
  file.mimetype.startsWith('image/')
    ? cb(null, true)
    : cb(new AppError('Images only.', 400), false);

const mediaFilter = (req, file, cb) =>
  (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf')
    ? cb(null, true)
    : cb(new AppError('File type not allowed.', 400), false);

// Dynamically picks the right Cloudinary storage per field name
const profileStorage = {
  _handleFile(req, file, cb) {
    const storage = file.fieldname === 'coverImage' ? coverImageStorage : avatarStorage;
    storage._handleFile(req, file, cb);
  },
  _removeFile(req, file, cb) {
    const storage = file.fieldname === 'coverImage' ? coverImageStorage : avatarStorage;
    storage._removeFile(req, file, cb);
  },
};

// Handles both 'avatar' and 'coverImage' in a single request
export const uploadProfileImages = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imgFilter,
}).fields([
  { name: 'avatar',     maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]);

// Legacy single avatar (kept for any other usage)
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imgFilter,
}).single('avatar');

export const uploadPostImages = multer({
  storage: postImageStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: imgFilter,
}).array('images', 10);

export const uploadChatMedia = multer({
  storage: chatMediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: mediaFilter,
}).single('media');

// Wraps any multer middleware with proper error handling
export const handleUpload = (fn) => (req, res, next) =>
  fn(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE')  return next(new AppError('File too large.', 400));
      if (err.code === 'LIMIT_FILE_COUNT') return next(new AppError('Too many files.', 400));
      return next(new AppError(err.message, 400));
    }
    next(err);
  });


