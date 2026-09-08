import express from 'express';
import passport from '../../config/passport.js';
import authController from './auth.controller.js';

const router = express.Router();

// Local
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=google_failed' }),
  authController.oauthSuccess
);

// Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: 'http://localhost:5173/login?error=facebook_failed' }),
  authController.oauthSuccess
);

// Discord
router.get('/discord', passport.authenticate('discord'));
router.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: 'http://localhost:5173/login?error=discord_failed' }),
  authController.oauthSuccess
);

export default router;