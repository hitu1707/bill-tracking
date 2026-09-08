import passport from '../../config/passport.js';
import authService from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/responseHandler.js';

class AuthController {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || !email || !password) {
        return errorResponse(res, 400, 'Name, email, and password are required fields');
      }

      if (password.length < 6) {
        return errorResponse(res, 400, 'Password must be at least 6 characters long');
      }

      const user = await authService.register({ name, email, password, phone });

      // Automatically log the user in after registration
      req.login(user, (err) => {
        if (err) return next(err);
        return successResponse(res, 201, 'User registered and logged in successfully', { user });
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  async login(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return errorResponse(res, 401, info?.message || 'Invalid email or password');
      }

      // Establish session cookie
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return successResponse(res, 200, 'Login successful', {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            authProvider: user.authProvider
          }
        });
      });
    })(req, res, next);
  }

  // POST /api/auth/logout
  logout(req, res, next) {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        return successResponse(res, 200, 'Logged out successfully');
      });
    });
  }

  // OAuth Redirect Callbacks (Google, Facebook, Discord)
  oauthSuccess(req, res) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // Simply redirect to dashboard; cookie is automatically sent by the browser!
    res.redirect(`${clientUrl}/dashboard`);
  }
}

export default new AuthController();