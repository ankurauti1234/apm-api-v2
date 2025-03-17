import express from 'express';
import { 
  getEvents, 
  getRealTimeEvents,
  getLatestEvents,
  getLatestEventByDeviceAndType,
  getAssociatedDevicesWithLatestEvents,
  getAlerts,
  updateAlertStatus,
  getAllMeters,
  getAllSubmeters // Added new API
} from '../controllers/events-controller.js';

const router = express.Router();

// Existing event routes
router.get('/', getEvents);
router.get('/realtime', getRealTimeEvents);
router.get('/latest', getLatestEvents);
router.get('/latest/:deviceId/:type', getLatestEventByDeviceAndType);
router.get('/meters/associated', getAssociatedDevicesWithLatestEvents);
router.get('/meters', getAllMeters);
router.get('/submeters', getAllSubmeters); // Added new route

// New alert routes
router.get('/alerts', getAlerts);
router.put('/alerts/:eventId/status', updateAlertStatus);

export default router;