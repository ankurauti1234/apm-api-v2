import express from 'express';
import { storeLocation } from '../controllers/location-controller.js';

const router = express.Router();

// POST route to store location
router.post('/store', storeLocation);

export default router;