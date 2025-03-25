// event-type-routes.js
import express from 'express';
import {
  addEventType,
  addMultipleEventTypes,
  getEventTypes,
  updateEventType,
  deleteEventType
} from '../controllers/event-type-controller.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and role restriction to all routes
// Explicitly allowing only 'admin' and 'developer' roles
router.use(authenticate, restrictTo('admin', 'developer'));

router.post('/add', addEventType);
router.post('/add-multiple', addMultipleEventTypes);
router.get('/', getEventTypes);
router.put('/:id', updateEventType);
router.delete('/:id', deleteEventType);

export default router;