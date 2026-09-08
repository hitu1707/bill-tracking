import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary.js';
import logger from '../config/logger.js';

export const uploadToCloudinary = async (localFilePath) => {
  const absolutePath = path.resolve(localFilePath);
  const fileName = path.basename(localFilePath);
  const localFallbackUrl = `http://localhost:3000/uploads/${fileName}`;

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      logger.info(`Cloudinary not configured. Serving local file: ${localFallbackUrl}`);
      return {
        imageUrl: localFallbackUrl,
        publicId: null
      };
    }

    logger.info(`Uploading image to Cloudinary: ${absolutePath}`);

    // Upload with normalized absolute path
    const result = await cloudinary.uploader.upload(absolutePath, {
      folder: 'bill-tracker',
      resource_type: 'image',
      transformation: [{ width: 1400, quality: 'auto', fetch_format: 'auto' }]
    });

    // Delete local temp file once cloud upload succeeds
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    logger.info(`Cloudinary upload successful: ${result.secure_url}`);

    return {
      imageUrl: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    logger.warn(`Cloudinary upload failed (${error.message}). Using local image fallback.`);
    // Local image is kept in uploads/ so it displays in frontend
    return {
      imageUrl: localFallbackUrl,
      publicId: null
    };
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error(`Cloudinary Delete Error: ${error.message}`);
  }
};