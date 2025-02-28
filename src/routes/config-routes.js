import express from 'express';
import { pushConfig, getConfigStatus } from '../controllers/config-controller.js';
import { decommissionDevices, getDecommissionStatus } from '../controllers/decommission-controller.js';

const router = express.Router();

router.post('/config', pushConfig);
router.get('/config/status', getConfigStatus);
router.post('/decommission', decommissionDevices);
router.get('/decommission/status', getDecommissionStatus);

export default router;