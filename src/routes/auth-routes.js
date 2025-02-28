import express from 'express';
import { register, login, verifyEmail, verifyPhone } from '../controllers/auth-controller.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/verify-phone', verifyPhone);

export default router;