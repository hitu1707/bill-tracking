import userService from './user.service.js';
import { successResponse } from '../../utils/responseHandler.js';

class UserController {
  // GET /api/users/profile
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user._id);
      return successResponse(res, 200, 'User profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/profile
  async updateProfile(req, res, next) {
    try {
      const updatedProfile = await userService.updateProfile(req.user._id, req.body);
      return successResponse(res, 200, 'Profile updated successfully', updatedProfile);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();