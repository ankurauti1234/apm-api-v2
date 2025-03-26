// routes/householdRoutes.js
import express from 'express';
import { addHousehold, getHousehold, getAllHouseholds, getSimplifiedHouseholds } from '../controllers/household-controller.js';

const router = express.Router();

// Add new household
router.post('/add', addHousehold);

// Get all households
router.get('/', getAllHouseholds);

// Get simplified households (specific route, must come before parameterized route)
router.get('/simplified', getSimplifiedHouseholds);

// Get household by HHID (parameterized route, should come after specific routes)
router.get('/:hhid', getHousehold);

export default router;