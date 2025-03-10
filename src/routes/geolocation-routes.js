import express from 'express';
import { getGeolocationGoogle, getGeolocationUnwired } from '../controllers/geolocation-controller.js';

const router = express.Router();

// POST routes for geolocation
router.post('/google', getGeolocationGoogle);
router.post('/unwired', getGeolocationUnwired);

export default router;