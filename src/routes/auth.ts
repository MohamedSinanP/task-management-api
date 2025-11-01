import express from 'express';
import { login, logout, refreshAccessToken, signup } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshAccessToken)
router.post('/logout', authenticate, logout);

export default router;