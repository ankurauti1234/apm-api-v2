import express from 'express';
import { listMeters } from '../controllers/ssh-controller.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and role restriction to all routes
// Explicitly allowing only 'admin' and 'developer' roles
router.use(authenticate, restrictTo('admin', 'developer'));
router.get('/meters', listMeters);

export default router;