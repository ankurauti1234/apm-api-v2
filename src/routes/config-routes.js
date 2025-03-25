import express from 'express';
import { pushConfig, getConfigStatus } from '../controllers/config-controller.js';
import { decommissionDevices, getDecommissionStatus } from '../controllers/decommission-controller.js';
import { authenticate, restrictTo, checkPasswordChange } from '../middleware/auth.js'; // Updated import

const router = express.Router();

// Apply authentication and password check to all routes
router.use(authenticate);

// Apply role restriction to specific routes
router.post('/config', restrictTo('admin', 'developer'), pushConfig);
router.get('/config/status', getConfigStatus);
router.post('/decommission', restrictTo('admin', 'developer'), decommissionDevices);
router.get('/decommission/status', getDecommissionStatus);

export default router;