import User from '../../models/User.js';

class UserRepository {
  // Find user by ID (exclude password field from result)
  async findById(userId) {
    return await User.findById(userId).select('-password');
  }

  // Update user profile details
  async updateById(userId, updateData) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
  }

  // Delete user account
  async deleteById(userId) {
    return await User.findByIdAndDelete(userId);
  }
}

export default new UserRepository();