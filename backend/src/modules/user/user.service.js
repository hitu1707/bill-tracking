import userRepository from './user.repository.js';
import logger from '../../config/logger.js';

class UserService {
  // Get current user's profile
  async getProfile(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      const error = new Error('User profile not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  // Update user profile information
  async updateProfile(userId, updateFields) {
    // Whitelist only allowed fields to be updated
    const allowedUpdates = ['name', 'phone', 'avatar'];
    const sanitizedData = {};

    allowedUpdates.forEach((field) => {
      if (updateFields[field] !== undefined) {
        sanitizedData[field] = updateFields[field];
      }
    });

    if (Object.keys(sanitizedData).length === 0) {
      const error = new Error('No valid fields provided for update');
      error.statusCode = 400;
      throw error;
    }

    const updatedUser = await userRepository.updateById(userId, sanitizedData);

    if (!updatedUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    logger.info(`Profile updated for user: ${updatedUser.email}`);
    return updatedUser;
  }
}

export default new UserService();