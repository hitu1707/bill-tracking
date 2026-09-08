import express from 'express';
import userController from './user.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// All user routes require a valid JWT token
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

export default router;