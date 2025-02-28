import express from 'express';
import {
  addEventType,
  addMultipleEventTypes,
  getEventTypes,
  updateEventType,
  deleteEventType
} from '../controllers/event-type-controller.js';

const router = express.Router();

router.post('/add', addEventType);
router.post('/add-multiple', addMultipleEventTypes);
router.get('/', getEventTypes);
router.put('/:id', updateEventType);
router.delete('/:id', deleteEventType);

export default router;