// routes/householdRoutes.js
import express from 'express';
import { addHousehold, getHousehold, getAllHouseholds } from '../controllers/household-controller.js';

const router = express.Router();

// Add new household
router.post('/add', addHousehold);

// Get household by HHID
router.get('/:hhid', getHousehold);

// Get all households
router.get('/', getAllHouseholds);

export default router;