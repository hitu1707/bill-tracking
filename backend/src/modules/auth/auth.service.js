import User from '../../models/User.js';
import { hashPassword } from '../../utils/password.js';
import logger from '../../config/logger.js';

class AuthService {
  async register({ name, email, password, phone }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error('An account with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    // Create user document
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || null,
      authProvider: 'local'
    });

    logger.info(`New user registered: ${user.email}`);

    // Return the full user document (includes _id for Passport session)
    return user;
  }
}

export default new AuthService();