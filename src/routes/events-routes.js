import express from 'express';
import { 
  getEvents, 
  getRealTimeEvents,
  getLatestEvents,
  getLatestEventByDeviceAndType,
  getAssociatedDevicesWithLatestEvents,
  getAlerts,
  updateAlertStatus,
  getAllMeters
} from '../controllers/events-controller.js';

const router = express.Router();

// Existing event routes
router.get('/', getEvents);
router.get('/realtime', getRealTimeEvents);
router.get('/latest', getLatestEvents);
router.get('/latest/:deviceId/:type', getLatestEventByDeviceAndType);
router.get('/meters/associated', getAssociatedDevicesWithLatestEvents);
router.get('/meters', getAllMeters);

// New alert routes
router.get('/alerts', getAlerts);              // Get all alerts with filtering and pagination
router.put('/alerts/:eventId/status', updateAlertStatus);  // Update alert status

export default router;