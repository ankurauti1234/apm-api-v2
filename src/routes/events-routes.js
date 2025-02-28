import express from 'express';
import { 
  getEvents, 
  getRealTimeEvents,
  getLatestEvents,
  getLatestEventByDeviceAndType 
} from '../controllers/events-controller.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/realtime', getRealTimeEvents);
router.get('/latest', getLatestEvents);
router.get('/latest/:deviceId/:type', getLatestEventByDeviceAndType);

export default router;